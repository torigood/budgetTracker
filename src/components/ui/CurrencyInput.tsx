import { forwardRef } from 'react'

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currency?: string
  error?: string
  label?: string
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ currency = 'CAD', error, label, className = '', ...props }, ref) => {
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
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`w-full rounded-[1.55rem] border bg-white py-4 pl-20 pr-4 text-right text-[2rem] font-semibold tabular-nums tracking-[-0.01em] text-[#141716] shadow-[var(--fintra-shadow-soft)] outline-none transition focus:ring-4 dark:bg-slate-800 dark:text-white ${
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
