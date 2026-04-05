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
  categories: { id: string; name: string; color: string } | null
}

export type DaySummary = {
  expense: number
  income: number
  transactions: CalendarTransaction[]
}

export function useCalendar(month: string) {
  return useQuery({
    queryKey: ['calendar', month],
    queryFn: async () => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, type, description, amount, currency, payment_method, categories(id, name, color)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date
      const byDate: Record<string, DaySummary> = {}
      for (const tx of (data ?? []) as unknown as CalendarTransaction[]) {
        if (!byDate[tx.date]) {
          byDate[tx.date] = { expense: 0, income: 0, transactions: [] }
        }
        if (tx.type === '지출') byDate[tx.date].expense += tx.amount
        else byDate[tx.date].income += tx.amount
        byDate[tx.date].transactions.push(tx)
      }
      return byDate
    },
    staleTime: 1000 * 60 * 2,
  })
}
