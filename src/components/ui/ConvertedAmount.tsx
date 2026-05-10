import { useMemo } from 'react'
import { useUIStore } from '@/lib/stores/ui.store'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'
import { convertAmount } from '@/lib/utils/currency'
import { formatCurrency } from '@/utils/format'

type ConvertedAmountProps = {
  amount: number
  fromCurrency: string
  className?: string
}

export function ConvertedAmount({ amount, fromCurrency, className = '' }: ConvertedAmountProps) {
  const { currency: targetCurrency } = useUIStore()
  const { data } = useExchangeRates(targetCurrency)

  const converted = useMemo(() => {
    if (fromCurrency === targetCurrency) return null
    return convertAmount(amount, fromCurrency, targetCurrency, data?.rates, data?.base)
  }, [amount, data?.base, data?.rates, fromCurrency, targetCurrency])

  if (converted === null) return null

  return (
    <span className={`text-[11px] text-slate-400 ${className}`}>
      (~{formatCurrency(converted, targetCurrency)})
    </span>
  )
}
