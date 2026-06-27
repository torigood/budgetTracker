import { describe, expect, it } from 'vitest'
import { formatAmountInput, parseAmountInput, sanitizeAmountInput } from './currency'

describe('amount input formatting', () => {
  it('adds comma grouping while keeping raw values parseable', () => {
    expect(formatAmountInput('1234567.89', 'CAD')).toBe('1,234,567.89')
    expect(sanitizeAmountInput('1,234,567.89', 'CAD')).toBe('1234567.89')
    expect(parseAmountInput('1,234,567.89')).toBe(1234567.89)
  })

  it('preserves a trailing decimal while the user is typing', () => {
    expect(formatAmountInput('1234.', 'USD')).toBe('1,234.')
    expect(sanitizeAmountInput('1,234.', 'USD')).toBe('1234.')
  })

  it('limits decimal currencies to two decimal places', () => {
    expect(sanitizeAmountInput('1234.5678', 'CAD')).toBe('1234.56')
    expect(formatAmountInput('1234.5678', 'CAD')).toBe('1,234.56')
  })

  it('removes decimals for whole-number currencies', () => {
    expect(sanitizeAmountInput('123456.78', 'KRW')).toBe('123456')
    expect(formatAmountInput('123456.78', 'JPY')).toBe('123,456')
  })
})
