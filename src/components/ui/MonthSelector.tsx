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
      <div className="flex items-center gap-1 rounded-full border border-white/80 bg-white/82 p-1 shadow-[var(--fintra-shadow-soft)]">
        {/* Today button */}
        <button
          onClick={() => onChange(current)}
          disabled={isCurrentMonth}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
            isCurrentMonth
              ? 'text-slate-300 dark:text-slate-600 cursor-default'
              : 'text-[#0b6f61] hover:bg-[#dceee9] dark:hover:bg-[#0d8a7a]/20 active:scale-95'
          }`}
          aria-label="현재 달로 이동"
        >
          <CalendarDays className="h-4 w-4" />
        </button>

        <button
          onClick={() => onChange(addMonths(value, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Month label — opens picker */}
        <button
          onClick={() => setShowPicker(true)}
          className="min-w-[104px] rounded-full px-2 py-1.5 text-center text-sm font-semibold text-[var(--fintra-charcoal)] transition hover:bg-slate-100 active:scale-95 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {getMonthLabelLocale(value, lang)}
        </button>

        <button
          onClick={() => onChange(addMonths(value, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-300"
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
