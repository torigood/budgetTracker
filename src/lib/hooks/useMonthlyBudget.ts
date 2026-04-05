import { useState, useCallback } from 'react'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export type MonthlyBudget = { amount: number; currency: CurrencyCode }

const STORAGE_KEY = 'monthly_budget'

export function loadMonthlyBudget(): MonthlyBudget | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MonthlyBudget) : null
  } catch {
    return null
  }
}

export function useMonthlyBudget() {
  const [budget, setBudgetState] = useState<MonthlyBudget | null>(loadMonthlyBudget)

  const setBudget = useCallback((b: MonthlyBudget | null) => {
    setBudgetState(b)
    if (b) localStorage.setItem(STORAGE_KEY, JSON.stringify(b))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { budget, setBudget }
}
