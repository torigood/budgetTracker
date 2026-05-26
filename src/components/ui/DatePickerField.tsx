import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui.store'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addMonths(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function getDays(month: string) {
  const [y, m] = month.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)
  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = []

  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, -i)
    cells.push({ date: toISO(d), day: d.getDate(), isCurrentMonth: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: `${y}-${pad(m)}-${pad(d)}`, day: d, isCurrentMonth: true })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(y, m, i)
      cells.push({ date: toISO(d), day: d.getDate(), isCurrentMonth: false })
    }
  }
  return cells
}

function formatDisplay(iso: string, lang: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (lang === 'ko') {
    return `${y}년 ${m}월 ${d}일 · ${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}요일`
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function formatMonthLabel(month: string, lang: string) {
  const [y, m] = month.split('-').map(Number)
  if (lang === 'ko') return `${y}년 ${m}월`
  const d = new Date(y, m - 1, 1)
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

interface DatePickerFieldProps {
  value: string
  onChange: (iso: string) => void
  error?: string
}

export function DatePickerField({ value, onChange, error }: DatePickerFieldProps) {
  const { lang } = useUIStore()
  const today = toISO(new Date())
  const initialMonth = value ? value.slice(0, 7) : today.slice(0, 7)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  const days = getDays(viewMonth)
  const weekdays = lang === 'ko' ? WEEKDAYS_KO : WEEKDAYS_EN

  function handleSelect(date: string) {
    onChange(date)
    setOpen(false)
  }

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!open) setViewMonth(value ? value.slice(0, 7) : today.slice(0, 7))
          setOpen((v) => !v)
        }}
        className={`flex w-full items-center gap-3 rounded-[1.35rem] border bg-[#f5f6f8] px-4 py-3.5 text-left transition dark:bg-slate-800 ${
          open
            ? 'border-[#006b5b]/30 ring-4 ring-[#006b5b]/10 bg-white dark:bg-slate-800'
            : 'border-transparent'
        }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[#006b5b]" />
        <span className={`flex-1 text-base font-medium ${value ? 'text-[#141716] dark:text-white' : 'text-[#a3aaa7]'}`}>
          {value ? formatDisplay(value, lang) : (lang === 'ko' ? '날짜를 선택하세요' : 'Select a date')}
        </span>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-500">{error}</p>}

      {/* Calendar panel */}
      {open && (
        <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-[var(--fintra-line)] bg-[#f9faf9] shadow-[var(--fintra-shadow-soft)] dark:border-slate-700/60 dark:bg-slate-800/80">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-[#141716] dark:text-white">
              {formatMonthLabel(viewMonth, lang)}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-700 dark:text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-3 pb-1">
            {weekdays.map((d, i) => (
              <div
                key={d}
                className={`py-1 text-center text-[10px] font-bold tracking-wide uppercase ${
                  i === 0 ? 'text-[#c46f63]' : i === 6 ? 'text-[#0b6f61]' : 'text-[#a3aaa7]'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1 px-3 pb-4">
            {days.map((cell) => {
              const isSelected = cell.date === value
              const isToday = cell.date === today
              const isSunday = new Date(cell.date).getDay() === 0
              const isSaturday = new Date(cell.date).getDay() === 6

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => handleSelect(cell.date)}
                  className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition active:scale-90 ${
                    isSelected
                      ? 'bg-[#006b5b] text-white shadow-[0_8px_16px_rgba(0,107,91,0.3)]'
                      : isToday
                      ? 'bg-[#dceee9] text-[#006b5b]'
                      : !cell.isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600'
                      : isSunday
                      ? 'text-[#c46f63] hover:bg-[#f8e8e4] dark:hover:bg-rose-900/20'
                      : isSaturday
                      ? 'text-[#0b6f61] hover:bg-[#dceee9] dark:hover:bg-emerald-900/20'
                      : 'text-[#141716] hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cell.day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#006b5b]" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="border-t border-[var(--fintra-line)] px-4 py-3 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setViewMonth(today.slice(0, 7))
                handleSelect(today)
              }}
              className="w-full rounded-[1rem] bg-white py-2.5 text-xs font-bold text-[#006b5b] shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-700 dark:text-emerald-400"
            >
              {lang === 'ko' ? '오늘로 이동' : 'Jump to today'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
