import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getMonthRange } from '@/utils/format'

export type CalendarTransaction = {
  id: string
  date: string
  type: '지출' | '수입'
  description: string
  amount: number
  currency: string
  payment_method: string
  created_at?: string
  categories: { id: string; name: string; color: string; icon: string } | null
}

export type DaySummary = {
  expense: number
  income: number
  expenseByCurrency: { currency: string; amount: number }[]
  incomeByCurrency: { currency: string; amount: number }[]
  transactions: CalendarTransaction[]
}

export function useCalendar(month: string) {
  return useQuery({
    queryKey: ['calendar', month],
    queryFn: async () => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, type, description, amount, currency, payment_method, created_at, categories(id, name, color, icon)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date
      const byDate: Record<string, DaySummary & { _expMap: Record<string, number>; _incMap: Record<string, number> }> = {}
      for (const tx of (data ?? []) as unknown as CalendarTransaction[]) {
        if (!byDate[tx.date]) {
          byDate[tx.date] = { expense: 0, income: 0, expenseByCurrency: [], incomeByCurrency: [], transactions: [], _expMap: {}, _incMap: {} }
        }
        const day = byDate[tx.date]
        if (tx.type === '지출') {
          day.expense += tx.amount
          day._expMap[tx.currency] = (day._expMap[tx.currency] ?? 0) + tx.amount
        } else {
          day.income += tx.amount
          day._incMap[tx.currency] = (day._incMap[tx.currency] ?? 0) + tx.amount
        }
        day.transactions.push(tx)
      }

      // Convert maps to sorted arrays, strip internal maps
      const result: Record<string, DaySummary> = {}
      for (const [date, day] of Object.entries(byDate)) {
        result[date] = {
          expense: day.expense,
          income: day.income,
          expenseByCurrency: Object.entries(day._expMap).map(([currency, amount]) => ({ currency, amount })).sort((a, b) => b.amount - a.amount),
          incomeByCurrency: Object.entries(day._incMap).map(([currency, amount]) => ({ currency, amount })).sort((a, b) => b.amount - a.amount),
          transactions: day.transactions,
        }
      }
      return result
    },
    staleTime: 1000 * 60 * 2,
  })
}
