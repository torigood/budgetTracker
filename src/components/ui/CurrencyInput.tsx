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
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-medium text-gray-400">{currency}</span>
          <input
            ref={ref}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className={`w-full rounded-xl border bg-white dark:bg-gray-800 py-3 pl-14 pr-4 text-right text-xl font-semibold outline-none transition focus:border-blue-500 dark:border-gray-700 dark:text-white ${
              error ? 'border-red-400' : 'border-gray-200'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
