import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthLabel } from '@/utils/format'

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
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(addMonths(value, -1))}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition"
        aria-label="이전 달"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[96px] text-center text-sm font-semibold text-slate-800 dark:text-slate-200">
        {getMonthLabel(value)}
      </span>
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
