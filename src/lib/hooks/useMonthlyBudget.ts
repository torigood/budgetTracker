import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export type MonthlyBudget = { amount: number; currency: CurrencyCode }

type MonthlyBudgetRow = {
  amount: number
  currency: string
  month: string
}

export async function fetchMonthlyBudgetForMonth(userId: string, month: string): Promise<MonthlyBudget | null> {
  const { data: currentRows, error: currentError } = await supabase
    .from('monthly_budgets')
    .select('amount, currency, month')
    .eq('user_id', userId)
    .eq('month', month)

  if (currentError) throw currentError
  if (currentRows && currentRows.length > 0) {
    const row = currentRows[0] as MonthlyBudgetRow
    return { amount: Number(row.amount), currency: row.currency as CurrencyCode }
  }

  return null
}

export function useMonthlyBudget(month: string) {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['monthly-budget', userId, month],
    queryFn: () => fetchMonthlyBudgetForMonth(userId as string, month),
    enabled: !!userId && !!month,
  })

  const setBudget = useCallback(async (b: MonthlyBudget | null) => {
    if (!userId) return
    if (!b) {
      const { error } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('user_id', userId)
        .eq('month', month)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('monthly_budgets')
        .upsert({
          user_id: userId,
          month,
          amount: b.amount,
          currency: b.currency,
        }, { onConflict: 'user_id,month' })
      if (error) throw error
    }

    await queryClient.invalidateQueries({ queryKey: ['monthly-budget', userId, month] })
  }, [month, queryClient, userId])

  return { budget: data ?? null, setBudget }
}
