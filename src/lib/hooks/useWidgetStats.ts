import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/utils/format'

function getWeekStartISO(): string {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = day === 0 ? 6 : day - 1 // days since Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function getYesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function groupByCurrency(rows: { amount: number; currency: string }[]): Record<string, number> {
  const map: Record<string, number> = {}
  rows.forEach((r) => {
    map[r.currency] = (map[r.currency] ?? 0) + r.amount
  })
  return map
}

export type CurrencyRow = { currency: string; amount: number }

function toRows(map: Record<string, number>): CurrencyRow[] {
  return Object.entries(map)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function useWidgetStats() {
  return useQuery({
    queryKey: ['widget-stats'],
    queryFn: async () => {
      const today = todayISO()
      const yesterday = getYesterdayISO()
      const weekStart = getWeekStartISO()

      const now = new Date()
      const dayOfMonth = now.getDate()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      // Last month range
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const py = prevDate.getFullYear()
      const pm = prevDate.getMonth() + 1
      const prevMonthStart = `${py}-${String(pm).padStart(2, '0')}-01`
      const prevMonthDays = new Date(py, pm, 0).getDate()
      const prevMonthEnd = `${py}-${String(pm).padStart(2, '0')}-${String(prevMonthDays).padStart(2, '0')}`

      // Days from Monday to today (1-indexed)
      const weekDays = Math.floor(
        (new Date(today + 'T00:00:00').getTime() - new Date(weekStart + 'T00:00:00').getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1

      const [weekRes, monthRes, prevRes] = await Promise.all([
        supabase.from('transactions')
          .select('amount, currency, date')
          .eq('type', '지출')
          .gte('date', weekStart)
          .lte('date', today),
        supabase.from('transactions')
          .select('amount, currency')
          .eq('type', '지출')
          .gte('date', monthStart)
          .lte('date', today),
        supabase.from('transactions')
          .select('amount, currency')
          .eq('type', '지출')
          .gte('date', prevMonthStart)
          .lte('date', prevMonthEnd),
      ])

      const weekRows = weekRes.data ?? []
      const monthRows = monthRes.data ?? []
      const prevRows = prevRes.data ?? []

      const weekByCur = groupByCurrency(weekRows)
      const todayByCur = groupByCurrency(weekRows.filter(r => r.date === today))
      const yesterdayByCur = groupByCurrency(weekRows.filter(r => r.date === yesterday))
      const monthByCur = groupByCurrency(monthRows)
      const prevMonthByCur = groupByCurrency(prevRows)

      // Daily averages
      const monthAvg: Record<string, number> = {}
      Object.entries(monthByCur).forEach(([c, total]) => {
        monthAvg[c] = total / dayOfMonth
      })
      const prevMonthAvg: Record<string, number> = {}
      Object.entries(prevMonthByCur).forEach(([c, total]) => {
        prevMonthAvg[c] = total / prevMonthDays
      })

      return {
        weekExpense: toRows(weekByCur),
        todayExpense: toRows(todayByCur),
        yesterdayExpense: toRows(yesterdayByCur),
        monthDailyAvg: toRows(monthAvg),
        prevMonthDailyAvg: toRows(prevMonthAvg),
        weekDays,
        dayOfMonth,
        prevMonthDays,
      }
    },
    staleTime: 1000 * 60 * 5,
  })
}
