import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Settings } from 'lucide-react'
import { useCalendar, type CalendarTransaction } from '@/lib/hooks/useCalendar'
import { useUIStore } from '@/lib/stores/ui.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { MonthPickerModal } from '@/components/ui/MonthPickerModal'
import { CategoryBadge } from '@/components/ui/Badge'
import { ConvertedAmount } from '@/components/ui/ConvertedAmount'
import { formatCurrency, formatDateShort, getCurrentMonth, getMonthLabelLocale, formatCompactCurrency } from '@/utils/format'
import { useT } from '@/lib/hooks/useT'

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
  const t = useT()
  const { data: byDate, isLoading } = useCalendar(selectedMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)

  const days = getDaysInMonth(selectedMonth)
  const today = todayISO()
  const currentMonth = getCurrentMonth()
  const isCurrentMonth = selectedMonth === currentMonth
  const selectedDaySummary = selectedDate ? byDate?.[selectedDate] : null
  const monthTotals = Object.values(byDate ?? {}).reduce(
    (acc, day) => ({
      expense: acc.expense + day.expense,
      income: acc.income + day.income,
      count: acc.count + day.transactions.length,
    }),
    { expense: 0, income: 0, count: 0 }
  )
  const activeDayCount = Object.keys(byDate ?? {}).length
  const topExpense = Math.max(1, ...Object.values(byDate ?? {}).map((day) => day.expense))
  const selectedCategoryGroups = selectedDaySummary?.transactions.reduce(
    (groups, tx) => {
      const key = tx.categories?.id ?? 'uncategorized'
      if (!groups[key]) {
        groups[key] = {
          name: tx.categories?.name ?? (lang === 'ko' ? '기타' : 'Other'),
          color: tx.categories?.color ?? '#8aa79a',
          icon: tx.categories?.icon ?? '',
          total: 0,
          count: 0,
        }
      }
      if (tx.type === '지출') groups[key].total += tx.amount
      groups[key].count += 1
      return groups
    },
    {} as Record<string, { name: string; color: string; icon: string; total: number; count: number }>
  )
  const selectedCategoryList = Object.entries(selectedCategoryGroups ?? {})
    .map(([id, group]) => ({ id, ...group }))
    .sort((a, b) => b.total - a.total)

  return (
    <div
      className="flex min-h-full flex-col pb-6"
      {...swipe}
      style={{ touchAction: selectedDate ? 'auto' : 'pan-y' }}
    >
      {/* Header */}
      <header className="fintra-page-header pr-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="fintra-kicker">{lang === 'ko' ? '캘린더' : 'Calendar'}</p>
            <h1 className="fintra-page-title mt-1.5 dark:text-white">
              {lang === 'ko' ? '월별 돈 흐름' : 'Monthly money flow'}
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-[var(--fintra-ink-2)]">
              {lang === 'ko' ? '날짜별 지출과 수입을 가볍게 확인하세요.' : 'A calm view of daily spending and income.'}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 -mr-1">
            <button
              onClick={() => navigate('/transactions/new')}
              className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[#006b5b] text-white shadow-[0_14px_28px_rgba(0,107,91,0.2)] transition active:scale-95"
              aria-label="거래 추가"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="fintra-icon-button h-11 w-11 rounded-2xl hover:text-[#0b6f61] dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700/90"
              aria-label={t('nav_settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-4 mt-2 rounded-[2rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-card)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f6f8] text-[#7d8582] transition active:scale-95 dark:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowPicker(true)}
            className="rounded-full px-4 py-2 text-center text-lg font-semibold tracking-[-0.01em] text-[#141716] transition active:scale-95 dark:text-white"
          >
            {getMonthLabelLocale(selectedMonth, lang)}
          </button>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f6f8] text-[#7d8582] transition active:scale-95 dark:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-[1.25rem] bg-[#f8e8e4] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c46f63]">{t('calendar_expense_label')}</p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[#141716]">{formatCurrency(monthTotals.expense, 'CAD')}</p>
          </div>
          <div className="rounded-[1.25rem] bg-[#e8f4ef] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#006b5b]">{t('calendar_income_label')}</p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[#141716]">{formatCurrency(monthTotals.income, 'CAD')}</p>
          </div>
          <button
            onClick={() => setSelectedMonth(currentMonth)}
            disabled={isCurrentMonth}
            className="rounded-[1.25rem] bg-[#f7f6f3] px-3 py-3 text-left transition active:scale-95 disabled:opacity-60"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8b9390]">{t('calendar_today')}</p>
            <p className="mt-1 text-sm font-bold text-[#141716]">{activeDayCount} days</p>
          </button>
        </div>
      </div>

      {showPicker && (
        <MonthPickerModal
          value={selectedMonth}
          onChange={setSelectedMonth}
          onClose={() => setShowPicker(false)}
          lang={lang}
        />
      )}

      {/* Calendar grid */}
      <div className="mx-4 mt-3 overflow-hidden rounded-[2rem] border border-white/80 bg-white p-3 shadow-[var(--fintra-shadow-card)] dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`py-2 text-center text-[11px] font-bold ${
                i === 0 ? 'text-[#c46f63]' : i === 6 ? 'text-[#006b5b]' : 'text-[#9aa19e]'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(({ date, day, isCurrentMonth }, idx) => {
            const summary = byDate?.[date]
            const isToday = date === today
            const isSelected = date === selectedDate
            const colIdx = idx % 7
            const expensePct = summary?.expense ? Math.min(100, Math.max(18, (summary.expense / topExpense) * 100)) : 0

            return (
              <button
                key={date}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                disabled={isLoading}
                className={`relative flex min-h-[80px] flex-col items-center rounded-[1.15rem] px-1 pb-2 pt-2 transition active:scale-[0.98] ${
                  !isCurrentMonth ? 'opacity-35' : ''
                } ${isSelected ? 'bg-[#e8f4ef] shadow-[inset_0_0_0_1px_rgba(0,107,91,0.18)] dark:bg-[#0d8a7a]/20' : 'bg-[#fbfbfa] hover:bg-[#f5f6f8] dark:bg-slate-800/35 dark:hover:bg-slate-800/60'}`}
              >
                {/* Day number */}
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? 'bg-[#006b5b] text-white'
                      : colIdx === 0
                      ? 'text-[#c46f63]'
                      : colIdx === 6
                      ? 'text-[#006b5b]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {day}
                </span>

                {/* Amounts */}
                {summary ? (
                  <div className="mt-auto flex w-full flex-col items-center gap-0.5 px-0.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-[#edf1ef]">
                      {summary.expense > 0 && (
                        <span className="block h-full rounded-full bg-[#c46f63]" style={{ width: `${expensePct}%` }} />
                      )}
                    </div>
                    {summary.expense > 0 && (
                      <span className="mt-0.5 w-full truncate text-center text-[7.5px] font-bold tabular-nums leading-tight text-[#c46f63]">
                        -{formatCompactCurrency(summary.expenseByCurrency[0]?.amount ?? summary.expense, summary.expenseByCurrency[0]?.currency ?? 'CAD')}
                      </span>
                    )}
                    {summary.income > 0 && (
                      <span className="w-full truncate text-center text-[7.5px] font-bold tabular-nums leading-tight text-[#006b5b]">
                        +{formatCompactCurrency(summary.incomeByCurrency[0]?.amount ?? summary.income, summary.incomeByCurrency[0]?.currency ?? 'CAD')}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-auto h-4" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center px-3 pt-8 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center sm:pb-8"
          onClick={() => setSelectedDate(null)}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-[#141716]/35 backdrop-blur-sm" />
          <div
            className="relative z-10 flex max-h-[88svh] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.25rem] border border-white/80 bg-[#fbfbfa] shadow-[0_28px_80px_rgba(20,23,22,0.22)] dark:border-slate-800/70 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet header */}
            <div className="relative overflow-hidden border-b border-[var(--fintra-line)] px-5 py-5 dark:border-slate-800">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,#f2e4d4_0%,rgba(251,251,250,0)_100%)]" />
              <div className="relative">
              <div className="flex items-start justify-between gap-3">
              <div>
                <p className="fintra-kicker">{selectedDate === today ? t('calendar_today') : lang === 'ko' ? '선택한 날짜' : 'Selected date'}</p>
                <h2 className="mt-1 text-[1.35rem] font-semibold text-[#141716] dark:text-white">
                  {formatDateShort(selectedDate)}
                </h2>
                {selectedDaySummary && (
                  <div className="mt-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b9390]">
                      {lang === 'ko' ? '하루 총 지출' : 'Daily spending'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
                      {selectedDaySummary.expenseByCurrency.length ? selectedDaySummary.expenseByCurrency.map(({ currency: c, amount }) => (
                        <span key={c} className="text-[2rem] font-semibold leading-none tracking-[-0.01em] tabular-nums text-[#c46f63]">
                          {formatCurrency(amount, c)}
                        </span>
                      )) : (
                        <span className="text-[2rem] font-semibold leading-none tracking-[-0.01em] text-[#141716]">
                          {formatCurrency(0, 'CAD')}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedDaySummary.incomeByCurrency.map(({ currency: c, amount }) => (
                        <span key={c} className="rounded-full bg-[#e8f4ef] px-3 py-1.5 text-xs font-bold text-[#006b5b]">
                          {t('calendar_income_label')} +{formatCurrency(amount, c)}
                        </span>
                      ))}
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#7d8582] shadow-[var(--fintra-shadow-soft)]">
                        {selectedDaySummary.transactions.length} {lang === 'ko' ? '건' : 'items'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/transactions/new`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006b5b] text-white shadow-[0_12px_24px_rgba(0,107,91,0.2)] transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#8b9390] shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              </div>
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
                  <p className="text-sm text-slate-400">{t('calendar_empty')}</p>
                  <button
                    onClick={() => navigate('/transactions/new')}
                    className="mt-2 text-xs font-bold text-[#006b5b]"
                  >
                    {t('calendar_add')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 px-5 py-5">
                  <section className="rounded-[1.55rem] border border-[var(--fintra-line)] bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#141716] dark:text-white">
                        {lang === 'ko' ? '카테고리별 지출' : 'By category'}
                      </h3>
                      <span className="text-[11px] font-bold text-[#8b9390]">
                        {selectedCategoryList.length} {lang === 'ko' ? '개 카테고리' : 'categories'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {selectedCategoryList.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                            style={{ backgroundColor: `${cat.color}16`, color: cat.color }}
                          >
                            {cat.icon || cat.name[0]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-[#141716] dark:text-white">{cat.name}</p>
                              <p className="shrink-0 text-sm font-bold tabular-nums text-[#c46f63]">
                                {cat.total > 0 ? formatCurrency(cat.total, selectedDaySummary.transactions[0]?.currency ?? 'CAD') : '-'}
                              </p>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf1ef]">
                              <span
                                className="block h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(10, (cat.total / Math.max(1, selectedDaySummary.expense)) * 100))}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[1.55rem] border border-[var(--fintra-line)] bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-800 dark:bg-slate-900/70">
                    <h3 className="mb-4 text-sm font-semibold text-[#141716] dark:text-white">
                      {lang === 'ko' ? '지출 타임라인' : 'Spending timeline'}
                    </h3>
                    <div className="space-y-0">
                      {selectedDaySummary.transactions.map((tx: CalendarTransaction, index) => {
                        const time = tx.created_at
                          ? new Date(tx.created_at).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'
                        return (
                          <div key={tx.id} className="relative flex gap-3 pb-4 last:pb-0">
                            {index < selectedDaySummary.transactions.length - 1 && (
                              <span className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-px bg-[#edf1ef]" />
                            )}
                            <div
                              className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
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
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{tx.description}</p>
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-slate-400">{time}</span>
                                    <span className="text-[11px] text-slate-300">·</span>
                                    <span className="text-[11px] font-medium text-slate-400">{tx.payment_method}</span>
                                  </div>
                                  {tx.categories && (
                                    <div className="mt-1.5">
                                      <CategoryBadge color={tx.categories.color} label={tx.categories.name} icon={tx.categories.icon} size="sm" />
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className={`block text-sm font-bold tabular-nums ${tx.type === '지출' ? 'text-[#c46f63]' : 'text-[#006b5b]'}`}>
                                    {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                                  </span>
                                  <ConvertedAmount amount={tx.amount} fromCurrency={tx.currency} sign={tx.type === '지출' ? '-' : '+'} className="mt-0.5 block" />
                                  <button
                                    onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                                    className="mt-1 inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  <button
                    onClick={() => navigate('/transactions/new')}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-[1.35rem] bg-[#006b5b] text-sm font-bold text-white shadow-[0_18px_36px_rgba(0,107,91,0.22)] transition active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    {lang === 'ko' ? '이 날짜에 거래 추가' : 'Quick add transaction'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
