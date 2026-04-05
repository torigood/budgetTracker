import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type AnnualMonth = {
  month: string // 'YYYY-MM'
  expense: number
  income: number
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

      // Build 12-month map (primary currency only)
      const monthMap: Record<string, AnnualMonth> = {}
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${String(m).padStart(2, '0')}`
        monthMap[key] = { month: key, expense: 0, income: 0 }
      }

      ;(data ?? []).filter((t) => (t.currency ?? 'CAD') === primaryCurrency).forEach((t) => {
        const key = t.date.slice(0, 7)
        if (!monthMap[key]) return
        if (t.type === '지출') monthMap[key].expense += t.amount
        else monthMap[key].income += t.amount
      })

      const months = Object.values(monthMap)
      const totalExpense = months.reduce((s, m) => s + m.expense, 0)
      const totalIncome = months.reduce((s, m) => s + m.income, 0)

      return { months, totalExpense, totalIncome, primaryCurrency }
    },
  })
}
