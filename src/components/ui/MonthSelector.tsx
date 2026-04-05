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
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addMonths(value, -1))}
        className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[100px] text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
        {getMonthLabel(value)}
      </span>
      <button
        onClick={() => onChange(addMonths(value, 1))}
        className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
