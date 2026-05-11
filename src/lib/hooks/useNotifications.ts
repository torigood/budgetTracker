import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISO, formatCurrency } from '@/utils/format'
import { fetchBudgetGoalsForMonth } from './useBudgetGoals'
import { fetchMonthlyBudgetForMonth } from './useMonthlyBudget'

// ─── Push subscription ────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!vapidKey) { console.warn('VITE_VAPID_PUBLIC_KEY not set'); return false }

  try {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()

    const sub = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    })

    const json = sub.toJSON()
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    }, { onConflict: 'user_id,endpoint' })

    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const sub = await registration.pushManager.getSubscription()
  if (sub) {
    await sub.unsubscribe()
    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', sub.endpoint)
  }
}

// ─── Settings keys ───────────────────────────────────────────────────────────

const KEYS = {
  budgetEnabled: 'notify_budget_enabled',
  monthlyBudgetEnabled: 'notify_monthly_budget_enabled',
  reminderEnabled: 'notify_reminder_enabled',
  reminderTime: 'notify_reminder_time',
  anomalyEnabled: 'notify_anomaly_enabled',
  lastReminderDate: 'notify_last_reminder_date',
  monthlyBudgetAlertMonth: 'notify_monthly_budget_alert_month',
} as const

export type NotifySettings = {
  budgetEnabled: boolean
  monthlyBudgetEnabled: boolean
  reminderEnabled: boolean
  reminderTime: string
  anomalyEnabled: boolean
}

export function getNotifySettings(): NotifySettings {
  return {
    budgetEnabled: localStorage.getItem(KEYS.budgetEnabled) !== 'false',
    monthlyBudgetEnabled: localStorage.getItem(KEYS.monthlyBudgetEnabled) !== 'false',
    reminderEnabled: localStorage.getItem(KEYS.reminderEnabled) === 'true',
    reminderTime: localStorage.getItem(KEYS.reminderTime) ?? '21:00',
    anomalyEnabled: localStorage.getItem(KEYS.anomalyEnabled) !== 'false',
  }
}

export function saveNotifySetting(key: keyof typeof KEYS, value: string) {
  localStorage.setItem(KEYS[key], value)
}

function monthKeyNow(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ─── Permission ───────────────────────────────────────────────────────────────

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

function fire(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/icons/logo192.png' })
}

// ─── A: Budget alert ──────────────────────────────────────────────────────────

export async function checkBudgetAlert(categoryId: string, categoryName: string) {
  const { budgetEnabled } = getNotifySettings()
  if (!budgetEnabled) return

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return

  const goals = await fetchBudgetGoalsForMonth(userId, monthKeyNow())
  const goal = goals[categoryId]
  if (!goal) return

  let goalAmount = goal.amount
  let goalCurrency = goal.currency
  if (goal.type === 'percent') {
    const budget = await fetchMonthlyBudgetForMonth(userId, monthKeyNow())
    if (!budget || budget.amount <= 0) return
    goalAmount = (budget.amount * (goal.percent ?? 0)) / 100
    goalCurrency = budget.currency
  }

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = todayISO()

  const { data } = await supabase
    .from('transactions')
    .select('amount')
    .eq('category_id', categoryId)
    .eq('type', '지출')
    .eq('currency', goalCurrency)
    .gte('date', monthStart)
    .lte('date', today)

  const total = (data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
  const pct = goalAmount > 0 ? Math.round((total / goalAmount) * 100) : 0

  if (pct >= 100) {
    fire(
      `${categoryName} 예산 초과!`,
      `${formatCurrency(total, goalCurrency)} / ${formatCurrency(goalAmount, goalCurrency)} (${pct}%)`
    )
  } else if (pct >= 80) {
    fire(
      `${categoryName} 예산 ${pct}% 달성`,
      `${formatCurrency(total, goalCurrency)} / ${formatCurrency(goalAmount, goalCurrency)}`
    )
  }
}

export async function checkMonthlyBudgetAlert() {
  const { monthlyBudgetEnabled } = getNotifySettings()
  if (!monthlyBudgetEnabled) return

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return

  const budget = await fetchMonthlyBudgetForMonth(userId, monthKeyNow())
  if (!budget || budget.amount <= 0) return

  const monthKey = monthKeyNow()
  if (localStorage.getItem(KEYS.monthlyBudgetAlertMonth) === monthKey) return

  const [year, month] = monthKey.split('-')
  const monthStart = `${year}-${month}-01`
  const today = todayISO()

  const { data } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', '지출')
    .eq('currency', budget.currency)
    .gte('date', monthStart)
    .lte('date', today)

  const spent = (data ?? []).reduce((sum: number, row: { amount: number }) => sum + row.amount, 0)
  const pct = Math.round((spent / budget.amount) * 100)

  if (pct < 80) return

  const lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ko'
  if (lang === 'en') {
    fire(
      'Monthly budget reached 80%',
      `You spent ${formatCurrency(spent, budget.currency)} of ${formatCurrency(budget.amount, budget.currency)}`
    )
  } else {
    fire(
      '월 예산 80% 도달',
      `${formatCurrency(spent, budget.currency)} / ${formatCurrency(budget.amount, budget.currency)} 사용했어요`
    )
  }

  localStorage.setItem(KEYS.monthlyBudgetAlertMonth, monthKey)
}

// ─── B: Daily reminder ────────────────────────────────────────────────────────

export async function checkDailyReminder() {
  const { reminderEnabled, reminderTime } = getNotifySettings()
  if (!reminderEnabled) return

  const today = todayISO()
  if (localStorage.getItem(KEYS.lastReminderDate) === today) return

  const [hours, minutes] = reminderTime.split(':').map(Number)
  const now = new Date()
  if (now.getHours() < hours || (now.getHours() === hours && now.getMinutes() < minutes)) return

  const { data } = await supabase
    .from('transactions')
    .select('id')
    .eq('date', today)
    .limit(1)

  if (!data?.length) {
    localStorage.setItem(KEYS.lastReminderDate, today)
    fire('오늘 지출 기록하셨나요?', '가계부를 업데이트하고 지출 습관을 확인해보세요!')
  }
}

// ─── C: Anomaly detection ─────────────────────────────────────────────────────

export async function checkAnomalyAlert(currency: string) {
  const { anomalyEnabled } = getNotifySettings()
  if (!anomalyEnabled) return

  const today = todayISO()
  const past = new Date()
  past.setDate(past.getDate() - 30)
  const pastISO = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`

  const [todayRes, historyRes] = await Promise.all([
    supabase.from('transactions')
      .select('amount')
      .eq('date', today)
      .eq('type', '지출')
      .eq('currency', currency),
    supabase.from('transactions')
      .select('amount, date')
      .gte('date', pastISO)
      .lt('date', today)
      .eq('type', '지출')
      .eq('currency', currency),
  ])

  const todayTotal = (todayRes.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  // Build daily totals from history
  const dailyMap: Record<string, number> = {}
  ;(historyRes.data ?? []).forEach((r: { date: string; amount: number }) => {
    dailyMap[r.date] = (dailyMap[r.date] ?? 0) + r.amount
  })
  const dailyValues = Object.values(dailyMap)
  if (dailyValues.length < 5) return // Not enough history

  const avgDaily = dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length
  const ratio = Math.round(todayTotal / avgDaily)

  if (todayTotal > avgDaily * 3) {
    fire(
      '이상 지출 감지!',
      `오늘 ${formatCurrency(todayTotal, currency)} — 일평균(${formatCurrency(Math.round(avgDaily), currency)})의 ${ratio}배`
    )
  }
}

// ─── Hook: run reminder check on mount ───────────────────────────────────────

export function useReminderCheck() {
  useEffect(() => {
    if (getPermission() === 'granted') {
      void checkDailyReminder()
    }
  }, [])
}
