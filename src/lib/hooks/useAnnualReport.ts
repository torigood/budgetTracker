import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type AnnualMonth = {
  month: string // 'YYYY-MM'
  expense: number
  income: number
}

export type AnnualRow = {
  date: string
  type: string
  amount: number
  currency: string | null
}

export function useAnnualReport(year: number) {
  return useQuery({
    queryKey: ['annual', year],
    queryFn: async () => {
      const start = `${year}-01-01`
      const end = `${year}-12-31`

      const { data, error } = await supabase
        .from('transactions')
        .select('date, type, amount, currency')
        .gte('date', start)
        .lte('date', end)

      if (error) throw error

      // Primary currency = most used currency by transaction count
      const currencyCount: Record<string, number> = {}
      ;(data ?? []).forEach((t) => {
        const c = t.currency ?? 'CAD'
        currencyCount[c] = (currencyCount[c] ?? 0) + 1
      })
      const primaryCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'CAD'

      return { rows: (data ?? []) as AnnualRow[], primaryCurrency }
    },
  })
}
