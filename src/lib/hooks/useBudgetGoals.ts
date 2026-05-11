import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export type BudgetGoal = { amount: number; currency: CurrencyCode; percent: number | null; type: 'amount' | 'percent' }
export type BudgetGoals = Record<string, BudgetGoal>

type BudgetLimitRow = {
  category_id: string
  limit_amount: number
  currency: string
  limit_percent: number | null
  limit_type: string
  month: string
}

function mapRowsToGoals(rows: BudgetLimitRow[]): BudgetGoals {
  return rows.reduce<BudgetGoals>((acc, row) => {
    acc[row.category_id] = {
      amount: Number(row.limit_amount),
      currency: row.currency as CurrencyCode,
      percent: row.limit_percent === null ? null : Number(row.limit_percent),
      type: row.limit_type === 'percent' ? 'percent' : 'amount',
    }
    return acc
  }, {})
}

export async function fetchBudgetGoalsForMonth(userId: string, month: string): Promise<BudgetGoals> {
  const { data: currentRows, error: currentError } = await supabase
    .from('budget_limits')
    .select('category_id, limit_amount, currency, limit_percent, limit_type, month')
    .eq('user_id', userId)
    .eq('month', month)

  if (currentError) throw currentError
  if (currentRows && currentRows.length > 0) return mapRowsToGoals(currentRows as BudgetLimitRow[])

  return {}
}

export function useBudgetGoals(month: string) {
  const userId = useAuthStore((s) => s.user?.id)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['budget-goals', userId, month],
    queryFn: () => fetchBudgetGoalsForMonth(userId as string, month),
    enabled: !!userId && !!month,
  })

  const setGoal = useCallback(async (categoryId: string, goal: BudgetGoal | null) => {
    if (!userId) return
    if (goal === null) {
      const { error } = await supabase
        .from('budget_limits')
        .delete()
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .eq('month', month)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('budget_limits')
        .upsert({
          user_id: userId,
          category_id: categoryId,
          month,
          limit_amount: goal.amount,
          currency: goal.currency,
          limit_percent: goal.percent,
          limit_type: goal.type,
        }, { onConflict: 'user_id,category_id,month' })
      if (error) throw error
    }

    await queryClient.invalidateQueries({ queryKey: ['budget-goals', userId, month] })
  }, [month, queryClient, userId])

  const setAllCurrencies = useCallback(async (currency: CurrencyCode) => {
    if (!userId || !data) return
    const entries = Object.entries(data)
    if (!entries.length) return

    const payload = entries.map(([categoryId, goal]) => ({
      user_id: userId,
      category_id: categoryId,
      month,
      limit_amount: goal.amount,
      currency,
      limit_percent: goal.percent,
      limit_type: goal.type,
    }))

    const { error } = await supabase
      .from('budget_limits')
      .upsert(payload, { onConflict: 'user_id,category_id,month' })

    if (error) throw error

    await queryClient.invalidateQueries({ queryKey: ['budget-goals', userId, month] })
  }, [data, month, queryClient, userId])

  return { goals: data ?? {}, setGoal, setAllCurrencies }
}
