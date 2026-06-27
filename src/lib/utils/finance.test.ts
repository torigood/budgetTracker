import { describe, expect, it } from 'vitest'
import { calculateBudgetProgress, calculateTransactionTotals } from './finance'

const rates = {
  CAD: 1,
  USD: 0.8,
  KRW: 1000,
}

describe('calculateTransactionTotals', () => {
  it('converts mixed currency income and expense into the target currency', () => {
    const totals = calculateTransactionTotals(
      [
        { type: '수입', amount: 100, currency: 'CAD' },
        { type: '수입', amount: 80, currency: 'USD' },
        { type: '지출', amount: 50, currency: 'CAD' },
        { type: '지출', amount: 10000, currency: 'KRW' },
      ],
      'CAD',
      rates,
      'CAD'
    )

    expect(totals.income).toBe(200)
    expect(totals.expense).toBe(60)
    expect(totals.net).toBe(140)
    expect(totals.currency).toBe('CAD')
  })

  it('uses income minus expense as the net calculation', () => {
    const totals = calculateTransactionTotals(
      [
        { type: '수입', amount: 300, currency: 'CAD' },
        { type: '지출', amount: 450, currency: 'CAD' },
      ],
      'CAD',
      rates,
      'CAD'
    )

    expect(totals.net).toBe(-150)
  })
})

describe('calculateBudgetProgress', () => {
  it('returns spent, remaining amount, used percent, and remaining percent', () => {
    expect(calculateBudgetProgress(275, 500)).toEqual({
      limit: 500,
      spent: 275,
      remainingAmount: 225,
      usedPct: 55,
      remainingPct: 45,
      isOverBudget: false,
    })
  })

  it('keeps remaining values at zero when over budget', () => {
    expect(calculateBudgetProgress(130, 100)).toEqual({
      limit: 100,
      spent: 130,
      remainingAmount: 0,
      usedPct: 130,
      remainingPct: 0,
      isOverBudget: true,
    })
  })
})
