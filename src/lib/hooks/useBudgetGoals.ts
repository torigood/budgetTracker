import { useState, useCallback } from 'react'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export type BudgetGoal = { amount: number; currency: CurrencyCode }
export type BudgetGoals = Record<string, BudgetGoal>

const STORAGE_KEY = 'budget_goals'

export function loadBudgetGoals(): BudgetGoals {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as BudgetGoals
  } catch {
    return {}
  }
}

export function useBudgetGoals() {
  const [goals, setGoals] = useState<BudgetGoals>(loadBudgetGoals)

  const setGoal = useCallback((categoryId: string, goal: BudgetGoal | null) => {
    setGoals((prev) => {
      const next = { ...prev }
      if (goal === null) {
        delete next[categoryId]
      } else {
        next[categoryId] = goal
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { goals, setGoal }
}
