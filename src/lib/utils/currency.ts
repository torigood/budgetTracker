export type ExchangeRates = {
  base: string
  rates: Record<string, number>
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>,
  baseCurrency?: string
): number | null {
  if (!rates || !baseCurrency) return null
  if (fromCurrency === toCurrency) return amount

  if (fromCurrency === baseCurrency) {
    const rate = rates[toCurrency]
    if (!rate) return null
    return amount * rate
  }

  if (toCurrency === baseCurrency) {
    const rate = rates[fromCurrency]
    if (!rate) return null
    return rate ? amount / rate : null
  }

  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]
  if (!fromRate || !toRate) return null
  return (amount / fromRate) * toRate
}

export function convertAmountOrZero(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>,
  baseCurrency?: string
): number {
  if (fromCurrency === toCurrency) return amount
  return convertAmount(amount, fromCurrency, toCurrency, rates, baseCurrency) ?? 0
}

export function parseAmountInput(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = String(value ?? '').replace(/,/g, '').trim()
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatAmountInput(value: string | number | null | undefined): string {
  const raw = String(value ?? '').replace(/,/g, '')
  if (!raw) return ''

  const [integerRaw, decimalRaw] = raw.split('.')
  const integer = integerRaw.replace(/\D/g, '')
  const decimal = decimalRaw?.replace(/\D/g, '')
  const formattedInteger = integer ? Number(integer).toLocaleString('en-US') : ''

  if (raw.includes('.')) return `${formattedInteger}. ${decimal ?? ''}`.replace('. ', '.')
  return formattedInteger
}
