import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, X, Edit2, CalendarDays, Settings } from 'lucide-react'
import { useCalendar, type CalendarTransaction } from '@/lib/hooks/useCalendar'
import { useUIStore } from '@/lib/stores/ui.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { MonthPickerModal } from '@/components/ui/MonthPickerModal'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort, getCurrentMonth, getMonthLabelLocale } from '@/utils/format'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getDaysInMonth(month: string): { date: string; day: number; isCurrentMonth: boolean }[] {
  const [y, m] = month.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)

  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = []

  // Pad start with previous month days
  const startPad = firstDay.getDay() // 0=Sun
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, -i)
    cells.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      day: d.getDate(),
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      isCurrentMonth: true,
    })
  }

  // Pad end to complete the last week
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(y, m, i)
      cells.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        day: d.getDate(),
        isCurrentMonth: false,
      })
    }
  }

  return cells
}

function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Calendar() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth, lang } = useUIStore()
  const { data: byDate, isLoading } = useCalendar(selectedMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)

  const days = getDaysInMonth(selectedMonth)
  const today = todayISO()
  const currentMonth = getCurrentMonth()
  const isCurrentMonth = selectedMonth === currentMonth
  const [y, m] = selectedMonth.split('-')

  const selectedDaySummary = selectedDate ? byDate?.[selectedDate] : null

  return (
    <div
      className="flex min-h-full flex-col pb-6"
      {...swipe}
      style={{ touchAction: selectedDate ? 'auto' : 'pan-y' }}
    >
      {/* Header */}
      <header className="mx-4 mt-3 flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-1">
          {/* Today button */}
          <button
            onClick={() => setSelectedMonth(currentMonth)}
            disabled={isCurrentMonth}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
              isCurrentMonth
                ? 'text-slate-300 dark:text-slate-600 cursor-default'
              : 'text-[#0d8a7a] hover:bg-[#dbefeb] dark:hover:bg-[#0d8a7a]/20 active:scale-95'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* Month label — opens picker */}
          <button
            onClick={() => setShowPicker(true)}
            className="min-w-[100px] rounded-2xl px-2 py-1 text-center text-base font-semibold tracking-tight text-slate-900 transition hover:bg-slate-100 active:scale-95 dark:text-white dark:hover:bg-slate-800"
          >
            {getMonthLabelLocale(selectedMonth, lang)}
          </button>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 transition hover:bg-slate-100 hover:text-[#0d8a7a] dark:bg-slate-900 dark:hover:bg-slate-800"
            aria-label="설정"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => navigate('/transactions/new')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d8a7a] text-white shadow-sm shadow-[#0d8a7a]/25 hover:bg-[#0a7568] transition active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      {showPicker && (
        <MonthPickerModal
          value={selectedMonth}
          onChange={setSelectedMonth}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}

      {/* Weekday headers */}
      <div className="mx-4 mt-3 grid grid-cols-7 rounded-t-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`py-2 text-center text-xs font-semibold ${
              i === 0 ? 'text-rose-400' : i === 6 ? 'text-[#0d8a7a]' : 'text-slate-400'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid — overflow-hidden to prevent page scroll */}
      <div className="mx-4 overflow-hidden rounded-b-2xl border-x border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {days.map(({ date, day, isCurrentMonth }, idx) => {
            const summary = byDate?.[date]
            const isToday = date === today
            const isSelected = date === selectedDate
            const colIdx = idx % 7

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                disabled={isLoading}
                className={`relative flex flex-col items-center pt-1.5 pb-1 min-h-[72px] transition ${
                  !isCurrentMonth ? 'opacity-30' : ''
                } ${isSelected ? 'bg-[#dbefeb] dark:bg-[#0d8a7a]/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
              >
                {/* Day number */}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                    isToday
                      ? 'bg-[#0d8a7a] text-white'
                      : colIdx === 0
                      ? 'text-rose-400'
                      : colIdx === 6
                      ? 'text-[#0d8a7a]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {day}
                </span>

                {/* Amount — show primary currency (largest amount) per type */}
                {summary && (
                  <div className="flex flex-col items-center gap-0.5 w-full px-0.5">
                    {summary.expenseByCurrency[0] && (
                      <span className="w-full text-center text-[9px] font-bold text-rose-400 tabular-nums leading-none">
                        -{formatCurrency(summary.expenseByCurrency[0].amount, summary.expenseByCurrency[0].currency).replace(/[^\d.,₩$€¥£]/g, '').slice(0, 9)}
                      </span>
                    )}
                    {summary.incomeByCurrency[0] && (
                      <span className="w-full text-center text-[9px] font-bold text-emerald-500 tabular-nums leading-none">
                        +{formatCurrency(summary.incomeByCurrency[0].amount, summary.incomeByCurrency[0].currency).replace(/[^\d.,₩$€¥£]/g, '').slice(0, 9)}
                      </span>
                    )}
                  </div>
                )}

                {/* Transaction count dot */}
                {summary && summary.transactions.length > 0 && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#0d8a7a]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          onClick={() => setSelectedDate(null)}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 flex max-h-[75dvh] w-full max-w-lg -translate-y-3 flex-col rounded-[2rem] border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/95 sm:-translate-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400">{selectedDate === today ? '오늘' : ''}</p>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {formatDateShort(selectedDate)}
                </h2>
                {selectedDaySummary && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {selectedDaySummary.expenseByCurrency.map(({ currency: c, amount }) => (
                      <span key={c} className="text-xs font-semibold text-rose-500">
                        지출 {formatCurrency(amount, c)}
                      </span>
                    ))}
                    {selectedDaySummary.incomeByCurrency.map(({ currency: c, amount }) => (
                      <span key={c} className="text-xs font-semibold text-emerald-500">
                        수입 {formatCurrency(amount, c)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/transactions/new`)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0d8a7a] text-white hover:bg-[#0a7568] transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Transaction list */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              data-swipe-month-ignore="true"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
              {!selectedDaySummary?.transactions.length ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-400">이 날의 거래가 없습니다</p>
                  <button
                    onClick={() => navigate('/transactions/new')}
                    className="mt-2 text-xs font-medium text-[#0d8a7a]"
                  >
                    거래 추가하기 →
                  </button>
                </div>
              ) : (
                selectedDaySummary.transactions.map((tx: CalendarTransaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{
                        backgroundColor: `${tx.categories?.color ?? '#94a3b8'}15`,
                        color: tx.categories?.color ?? '#94a3b8',
                      }}
                    >
                      {(() => {
                        const rawIcon = tx.categories?.icon?.trim() ?? ''
                        return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : (tx.categories?.name?.[0] ?? '?')
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{tx.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-400">{tx.payment_method}</span>
                        {tx.categories && (
                          <CategoryBadge color={tx.categories.color} label={tx.categories.name} icon={tx.categories.icon} size="sm" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold tabular-nums ${tx.type === '지출' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <button
                        onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
