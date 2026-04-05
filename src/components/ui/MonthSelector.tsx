import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthLabelLocale, getCurrentMonth } from '@/utils/format'
import { useUIStore } from '@/lib/stores/ui.store'

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

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addMonths(value, -1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition"
        aria-label="이전 달"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={() => onChange(current)}
        disabled={isCurrentMonth}
        className={`min-w-[96px] text-center text-sm font-semibold transition rounded-lg px-1 py-0.5 ${
          isCurrentMonth
            ? 'text-slate-800 dark:text-slate-200 cursor-default'
            : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:scale-95'
        }`}
        aria-label="현재 달로 이동"
        title="현재 달로 이동"
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
  )
}
