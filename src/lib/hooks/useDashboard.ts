import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getMonthRange } from '@/utils/format'

export function useDashboard(month: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: async () => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })

      if (error) throw error
      const transactions = data ?? []

      // Per-currency breakdown
      const currencyMap: Record<string, { expense: number; income: number }> = {}
      transactions.forEach((t) => {
        const cur = t.currency ?? 'CAD'
        if (!currencyMap[cur]) currencyMap[cur] = { expense: 0, income: 0 }
        if (t.type === '지출') currencyMap[cur].expense += t.amount
        else currencyMap[cur].income += t.amount
      })
      const byCurrency = Object.entries(currencyMap)
        .map(([currency, { expense, income }]) => ({
          currency,
          expense,
          income,
          net: income - expense,
        }))
        .sort((a, b) => b.expense + b.income - (a.expense + a.income))

      // Legacy single-currency totals (sum of primary currency or first found)
      const primaryCurrency = byCurrency[0]?.currency ?? 'CAD'
      const primaryTotals = currencyMap[primaryCurrency] ?? { expense: 0, income: 0 }
      const totalExpense = primaryTotals.expense
      const totalIncome = primaryTotals.income
      const netBalance = totalIncome - totalExpense

      const categoryMap: Record<string, { name: string; color: string; icon: string; amount: number }> = {}
      transactions
        .filter((t) => t.type === '지출')
        .forEach((t) => {
          if (!t.categories) return
          const cat = t.categories as { id: string; name: string; color: string; icon: string }
          if (!categoryMap[cat.id]) {
            categoryMap[cat.id] = { name: cat.name, color: cat.color, icon: cat.icon, amount: 0 }
          }
          categoryMap[cat.id].amount += t.amount
        })

      const categoryBreakdown = Object.entries(categoryMap)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => b.amount - a.amount)

      const recentTransactions = transactions.slice(0, 5)

      return { totalExpense, totalIncome, netBalance, categoryBreakdown, recentTransactions, byCurrency, primaryCurrency }
    },
  })
}

export function useAnalytics(month: string) {
  return useQuery({
    queryKey: ['analytics', month],
    queryFn: async () => {
      const months: string[] = []
      const [y, m] = month.split('-').map(Number)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(y, m - 1 - i, 1)
        months.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        )
      }

      const results = await Promise.all(
        months.map(async (mo) => {
          const { start, end } = getMonthRange(mo)
          const { data } = await supabase
            .from('transactions')
            .select('type, amount, category_id, categories(name, color)')
            .gte('date', start)
            .lte('date', end)
          const rows = data ?? []
          return {
            month: mo,
            expense: rows.filter((r) => r.type === '지출').reduce((s, r) => s + r.amount, 0),
            income: rows.filter((r) => r.type === '수입').reduce((s, r) => s + r.amount, 0),
            rows,
          }
        })
      )

      return results
    },
  })
}
