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
