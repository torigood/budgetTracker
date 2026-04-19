import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentMonth } from '@/utils/format'
import type { Lang } from '@/lib/i18n'

interface MonthPickerModalProps {
  value: string
  onChange: (month: string) => void
  onClose: () => void
  lang: Lang
}

export function MonthPickerModal({ value, onChange, onClose, lang }: MonthPickerModalProps) {
  const [pickerYear, setPickerYear] = useState(() => parseInt(value.split('-')[0]))
  const currentMonth = getCurrentMonth()
  const currentYear = parseInt(currentMonth.split('-')[0])

  const locale = lang === 'ko' ? 'ko-KR' : 'en-US'

  const months = Array.from({ length: 12 }, (_, i) => {
    const month = `${pickerYear}-${String(i + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(pickerYear, i, 1))
    return { month, label }
  })

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setPickerYear((y) => y - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPickerYear(currentYear)}
            className={`text-base font-bold transition rounded-lg px-2 py-0.5 ${
              pickerYear === currentYear
                ? 'text-slate-900 dark:text-white cursor-default'
                : 'text-[#0d8a7a] hover:bg-[#dbefeb] dark:hover:bg-[#0d8a7a]/20'
            }`}
          >
            {pickerYear}
          </button>
          <button
            onClick={() => setPickerYear((y) => y + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map(({ month, label }) => {
            const isSelected = month === value
            const isCurrent = month === currentMonth
            return (
              <button
                key={month}
                onClick={() => { onChange(month); onClose() }}
                className={`relative rounded-xl py-3 text-sm font-medium transition active:scale-95 ${
                  isSelected
                    ? 'bg-[#0d8a7a] text-white shadow-sm shadow-[#0d8a7a]/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
                {isCurrent && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${
                      isSelected ? 'bg-white/70' : 'bg-[#0d8a7a]'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
