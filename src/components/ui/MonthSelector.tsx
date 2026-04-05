import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { getMonthLabelLocale, getCurrentMonth } from '@/utils/format'
import { useUIStore } from '@/lib/stores/ui.store'
import { MonthPickerModal } from './MonthPickerModal'

interface MonthSelectorProps {
  value: string
  onChange: (month: string) => void
}

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const { lang } = useUIStore()
  const current = getCurrentMonth()
  const isCurrentMonth = value === current
  const [showPicker, setShowPicker] = useState(false)

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Today button */}
        <button
          onClick={() => onChange(current)}
          disabled={isCurrentMonth}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
            isCurrentMonth
              ? 'text-slate-300 dark:text-slate-600 cursor-default'
              : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:scale-95'
          }`}
          aria-label="현재 달로 이동"
        >
          <CalendarDays className="h-4 w-4" />
        </button>

        <button
          onClick={() => onChange(addMonths(value, -1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Month label — opens picker */}
        <button
          onClick={() => setShowPicker(true)}
          className="min-w-[96px] text-center text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition rounded-lg px-1 py-0.5"
        >
          {getMonthLabelLocale(value, lang)}
        </button>

        <button
          onClick={() => onChange(addMonths(value, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition"
          aria-label="다음 달"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {showPicker && (
        <MonthPickerModal
          value={value}
          onChange={onChange}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}
    </>
  )
}
