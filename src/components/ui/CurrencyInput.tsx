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
          <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-4 text-sm font-semibold text-slate-400 select-none">{currency}</span>
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`w-full rounded-xl border bg-white dark:bg-slate-800 py-3.5 pl-16 pr-4 text-right text-2xl font-bold outline-none transition focus:ring-3 dark:text-white ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/10'
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
