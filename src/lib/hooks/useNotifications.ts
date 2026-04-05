import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/utils/format'
import { loadBudgetGoals } from './useBudgetGoals'
import { formatCurrency } from '@/utils/format'

// ─── Settings keys ───────────────────────────────────────────────────────────

const KEYS = {
  budgetEnabled: 'notify_budget_enabled',
  reminderEnabled: 'notify_reminder_enabled',
  reminderTime: 'notify_reminder_time',
  anomalyEnabled: 'notify_anomaly_enabled',
  lastReminderDate: 'notify_last_reminder_date',
} as const

export type NotifySettings = {
  budgetEnabled: boolean
  reminderEnabled: boolean
  reminderTime: string
  anomalyEnabled: boolean
}

export function getNotifySettings(): NotifySettings {
  return {
    budgetEnabled: localStorage.getItem(KEYS.budgetEnabled) !== 'false',
    reminderEnabled: localStorage.getItem(KEYS.reminderEnabled) === 'true',
    reminderTime: localStorage.getItem(KEYS.reminderTime) ?? '21:00',
    anomalyEnabled: localStorage.getItem(KEYS.anomalyEnabled) !== 'false',
  }
}

export function saveNotifySetting(key: keyof typeof KEYS, value: string) {
  localStorage.setItem(KEYS[key], value)
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

  const goals = loadBudgetGoals()
  const goal = goals[categoryId]
  if (!goal) return

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = todayISO()

  const { data } = await supabase
    .from('transactions')
    .select('amount')
    .eq('category_id', categoryId)
    .eq('type', '지출')
    .eq('currency', goal.currency)
    .gte('date', monthStart)
    .lte('date', today)

  const total = (data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
  const pct = Math.round((total / goal.amount) * 100)

  if (pct >= 100) {
    fire(
      `${categoryName} 예산 초과!`,
      `${formatCurrency(total, goal.currency)} / ${formatCurrency(goal.amount, goal.currency)} (${pct}%)`
    )
  } else if (pct >= 80) {
    fire(
      `${categoryName} 예산 ${pct}% 달성`,
      `${formatCurrency(total, goal.currency)} / ${formatCurrency(goal.amount, goal.currency)}`
    )
  }
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
