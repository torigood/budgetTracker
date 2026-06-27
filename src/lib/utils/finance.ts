import { convertAmountOrZero } from './currency'

export type FinanceTransaction = {
  amount: number
  currency?: string | null
  type: '지출' | '수입' | string
}

export type FinanceTotals = {
  expense: number
  income: number
  net: number
  currency: string
}

export type BudgetProgress = {
  limit: number
  spent: number
  remainingAmount: number
  usedPct: number
  remainingPct: number
  isOverBudget: boolean
}

export function calculateTransactionTotals(
  transactions: FinanceTransaction[],
  targetCurrency: string,
  rates?: Record<string, number>,
  baseCurrency?: string
): FinanceTotals {
  const totals = transactions.reduce(
    (acc, tx) => {
      const converted = convertAmountOrZero(tx.amount, tx.currency ?? targetCurrency, targetCurrency, rates, baseCurrency)
      if (tx.type === '지출') acc.expense += converted
      if (tx.type === '수입') acc.income += converted
      return acc
    },
    { expense: 0, income: 0 }
  )

  return {
    expense: totals.expense,
    income: totals.income,
    net: totals.income - totals.expense,
    currency: targetCurrency,
  }
}

export function calculateBudgetProgress(spent: number, limit: number): BudgetProgress {
  const safeSpent = Number.isFinite(spent) ? Math.max(spent, 0) : 0
  const safeLimit = Number.isFinite(limit) ? Math.max(limit, 0) : 0
  const usedPct = safeLimit > 0 ? Math.round((safeSpent / safeLimit) * 100) : 0
  const remainingPct = safeLimit > 0 ? Math.max(100 - usedPct, 0) : 0

  return {
    limit: safeLimit,
    spent: safeSpent,
    remainingAmount: safeLimit > 0 ? Math.max(safeLimit - safeSpent, 0) : 0,
    usedPct,
    remainingPct,
    isOverBudget: safeLimit > 0 && safeSpent > safeLimit,
  }
}

export function convertBudgetLimit(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>,
  baseCurrency?: string
) {
  return convertAmountOrZero(amount, fromCurrency, toCurrency, rates, baseCurrency)
}
