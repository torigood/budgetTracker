import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getMonthRange } from '@/utils/format'

export function useDashboard(month: string) {
  return useQuery({
    queryKey: ['dashboard', month],
    queryFn: async () => {
      const { start, end } = getMonthRange(month)
      const [year, monthNum] = month.split('-').map(Number)
      const now = new Date()
      const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === monthNum
      const samePointDay = isCurrentMonth ? now.getDate() : new Date(year, monthNum, 0).getDate()
      const prevMonthDate = new Date(year, monthNum - 2, 1)
      const prevMonthStart = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`
      const prevMonthLastDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0).getDate()
      const prevMonthPointDay = Math.min(samePointDay, prevMonthLastDay)
      const prevMonthEnd = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(prevMonthPointDay).padStart(2, '0')}`

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

      const { data: prevRows, error: prevError } = await supabase
        .from('transactions')
        .select('type, amount, currency')
        .gte('date', prevMonthStart)
        .lte('date', prevMonthEnd)

      if (prevError) throw prevError

      const prevExpenseRows = (prevRows ?? [])
        .filter((t) => t.type === '지출')
        .map((t) => ({ amount: t.amount, currency: t.currency ?? 'CAD' }))

      const prevExpenseSamePoint = prevExpenseRows
        .filter((t) => t.currency === primaryCurrency)
        .reduce((sum, t) => sum + t.amount, 0)

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

      return {
        totalExpense,
        totalIncome,
        netBalance,
        prevExpenseSamePoint,
        prevExpenseRows,
        categoryBreakdown,
        recentTransactions,
        transactions,
        byCurrency,
        primaryCurrency,
      }
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
            .select('type, amount, category_id, currency, categories(name, color)')
            .gte('date', start)
            .lte('date', end)
          const rows = data ?? []

          const currencyCount: Record<string, number> = {}
          rows.forEach((r) => {
            const c = r.currency ?? 'CAD'
            currencyCount[c] = (currencyCount[c] ?? 0) + 1
          })
          const primaryCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'CAD'

          return {
            month: mo,
            expense: rows.filter((r) => r.type === '지출').reduce((s, r) => s + r.amount, 0),
            income: rows.filter((r) => r.type === '수입').reduce((s, r) => s + r.amount, 0),
            rows,
            primaryCurrency,
          }
        })
      )

      return results
    },
  })
}
