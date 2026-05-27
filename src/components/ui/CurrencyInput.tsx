import { forwardRef } from 'react'
import { formatAmountInput } from '@/lib/utils/currency'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  currency?: string
  error?: string
  label?: string
  value?: string | number
  onChange?: (value: string) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency = 'CAD', error, label, className = '', value, onChange, ...props }, ref) => {
    const displayValue = formatAmountInput(value)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const input = e.currentTarget
      const raw = input.value
        .replace(/,/g, '')
        .replace(/[^\d.]/g, '')
        .replace(/(\..*)\./g, '$1')
      const formatted = formatAmountInput(raw)
      const digitsBeforeCaret = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/[^\d.]/g, '').length

      onChange?.(raw)

      window.requestAnimationFrame(() => {
        let seen = 0
        let nextCaret = formatted.length
        for (let i = 0; i < formatted.length; i += 1) {
          if (/[\d.]/.test(formatted[i])) seen += 1
          if (seen >= digitsBeforeCaret) {
            nextCaret = i + 1
            break
          }
        }
        input.setSelectionRange(nextCaret, nextCaret)
      })
    }

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b9390] dark:text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-4 rounded-full bg-[#e8f4ef] px-2.5 py-1 text-xs font-bold text-[#006b5b] select-none">{currency}</span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            className={`w-full rounded-[1.55rem] border bg-white py-4 pl-20 pr-4 text-right text-[clamp(1.45rem,8vw,2rem)] font-semibold tabular-nums text-[#141716] shadow-[var(--fintra-shadow-soft)] outline-none transition focus:ring-4 dark:bg-slate-800 dark:text-white ${
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-[var(--fintra-line)] dark:border-slate-700 focus:border-[#006b5b]/20 focus:ring-[#006b5b]/10'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
