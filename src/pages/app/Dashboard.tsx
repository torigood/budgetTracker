import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, ArrowRight, Plus, CalendarDays } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useWidgetStats } from '@/lib/hooks/useWidgetStats'
import { useReminderCheck } from '@/lib/hooks/useNotifications'
import { useMonthlyBudget } from '@/lib/hooks/useMonthlyBudget'
import { useUIStore } from '@/lib/stores/ui.store'
import { useFilterStore } from '@/lib/stores/filter.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { useT } from '@/lib/hooks/useT'
import { translations } from '@/lib/i18n'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CardSkeleton, TransactionSkeleton } from '@/components/ui/Skeleton'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatCompactCurrency, formatCurrency, formatDateShort } from '@/utils/format'
import type { CurrencyRow } from '@/lib/hooks/useWidgetStats'

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth, lang } = useUIStore()
  const { setMonth: setFilterMonth } = useFilterStore()
  useReminderCheck()
  const { data, isLoading } = useDashboard(selectedMonth)
  const { budget } = useMonthlyBudget()
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)
  const t = useT()
  const tr = translations[lang]

  return (
    <div className="pb-10 pt-4" {...swipe}>
      {/* Header */}
      <header className="sticky top-3 z-10 mx-4 flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{t('dashboard_subtitle')}</p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{t('dashboard_title')}</h1>
        </div>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </header>

      <div className="space-y-4 px-4 py-4">
        {/* 요약 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (data?.byCurrency ?? []).length > 1 ? (
          // Multi-currency: show one row per currency
          <div className="space-y-3">
            {(data?.byCurrency ?? []).map((row) => (
              <div key={row.currency} className="card grid grid-cols-4 items-center gap-2 rounded-3xl bg-white/90 px-4 py-4 shadow-sm">
                <span className="text-xs font-bold tracking-[0.18em] text-indigo-500">{row.currency}</span>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('dashboard_expense')}</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-rose-500">{formatCurrency(row.expense, row.currency)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('dashboard_income')}</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-emerald-500">{formatCurrency(row.income, row.currency)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('dashboard_net')}</p>
                  <p className={`mt-1 text-sm font-bold tabular-nums ${row.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(Math.abs(row.net), row.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label={t('dashboard_expense')}
              amount={data?.totalExpense ?? 0}
              type="expense"
              icon={<TrendingDown className="h-4 w-4" />}
              currency={data?.primaryCurrency ?? 'CAD'}
            />
            <SummaryCard
              label={t('dashboard_income')}
              amount={data?.totalIncome ?? 0}
              type="income"
              icon={<TrendingUp className="h-4 w-4" />}
              currency={data?.primaryCurrency ?? 'CAD'}
            />
            <SummaryCard
              label={t('dashboard_net')}
              amount={data?.netBalance ?? 0}
              type={(data?.netBalance ?? 0) >= 0 ? 'income' : 'expense'}
              icon={<Minus className="h-4 w-4" />}
              currency={data?.primaryCurrency ?? 'CAD'}
            />
          </div>
        )}

        {/* 월 전체 예산 진행 바 */}
        {!isLoading && budget && (() => {
          // Find expense for the budget currency; fallback to primaryCurrency total
          const budgetRow = data?.byCurrency?.find(r => r.currency === budget.currency)
          const spent = budgetRow?.expense ?? (budget.currency === data?.primaryCurrency ? data?.totalExpense ?? 0 : 0)
          const pct = Math.min(Math.round((spent / budget.amount) * 100), 100)
          const isOver = spent > budget.amount
          return (
            <div className="card rounded-3xl bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm dark:from-slate-900 dark:to-slate-900/60">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('monthly_budget_title')}</p>
                <p className={`text-xs font-semibold tabular-nums ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>
                  {isOver ? t('monthly_budget_over') : tr.monthly_budget_used(pct)}
                </p>
              </div>
              <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="tabular-nums">{formatCurrency(spent, budget.currency)}</span>
                <span className="tabular-nums">{formatCurrency(budget.amount, budget.currency)}</span>
              </div>
              {!isOver && (
                <p className="mt-1 text-xs text-slate-400">{tr.monthly_budget_remaining(formatCurrency(budget.amount - spent, budget.currency))}</p>
              )}
            </div>
          )
        })()}

        {/* 위젯 배너 */}
        <WidgetBanner />

        {/* 빠른 추가 버튼 */}
        <button
          onClick={() => navigate('/transactions/new')}
          className="flex min-h-[64px] w-full items-center justify-between rounded-3xl bg-gradient-to-r from-indigo-500 via-indigo-500 to-violet-500 px-5 py-4 text-white shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100">{t('dashboard_add_prompt')}</p>
            <p className="text-base font-semibold tracking-tight">{t('dashboard_add_desc')}</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <Plus className="h-5 w-5" />
          </span>
        </button>

        {/* 카테고리 도넛 차트 */}
        {!isLoading && data && data.categoryBreakdown.length > 0 && (
          <div className="card rounded-3xl p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('dashboard_category_chart')}</h2>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="amount"
                      cx="50%"
                      cy="50%"
                      innerRadius={33}
                      outerRadius={52}
                      strokeWidth={2}
                      stroke="transparent"
                      animationDuration={350}
                    >
                      {data.categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrency(v as number, data?.primaryCurrency ?? 'CAD')}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid rgb(226 232 240 / 0.9)',
                        fontSize: '12px',
                        boxShadow: '0 20px 45px -20px rgb(15 23 42 / 0.2)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {data.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2">
                    <CategoryBadge color={cat.color} label={cat.name} size="sm" />
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                      {formatCurrency(cat.amount, data?.primaryCurrency ?? 'CAD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 최근 거래 */}
        <div className="card overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4 dark:border-slate-800/60">
            <h2 className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">{t('dashboard_recent')}</h2>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
            >
              <CalendarDays className="h-3.5 w-3.5" /> {t('dashboard_view_calendar')}
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
          ) : !data?.recentTransactions.length ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-400">{t('dashboard_empty')}</p>
              <button
                onClick={() => navigate('/transactions/new')}
                className="mt-3 inline-flex min-h-[48px] items-center justify-center rounded-full bg-indigo-50 px-4 text-xs font-semibold text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
              >
                {t('dashboard_add_first')}
              </button>
            </div>
          ) : (
            data.recentTransactions.map((tx) => {
              const cat = tx.categories as { name: string; color: string } | null
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-50/80 px-5 py-4 transition-colors last:border-0 hover:bg-slate-50/70 active:bg-slate-100/70 dark:border-slate-800/60 dark:hover:bg-slate-800/30 dark:active:bg-slate-800/50"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm"
                    style={{
                      backgroundColor: `${cat?.color ?? '#6b7280'}18`,
                      color: cat?.color ?? '#6b7280',
                    }}
                  >
                    {cat?.name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-slate-400">{formatDateShort(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    tx.type === '지출' ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Widget Banner ────────────────────────────────────────────────────────────

function CurrencyList({ rows, emptyLabel }: { rows: CurrencyRow[]; emptyLabel: string }) {
  if (!rows.length) return <p className="text-sm text-slate-400">{emptyLabel}</p>
  return (
    <div className="space-y-0.5">
      {rows.map((r) => (
        <p key={r.currency} className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
          {formatCurrency(r.amount, r.currency)}
        </p>
      ))}
    </div>
  )
}

function WidgetBanner() {
  const t = useT()
  const { lang } = useUIStore()
  const tr = translations[lang]
  const { data, isLoading } = useWidgetStats()
  const [slide, setSlide] = useState(0)
  const TOTAL = 3
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)

  function resetTimer(nextSlide?: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % TOTAL), 4000)
    if (nextSlide !== undefined) setSlide(nextSlide)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % TOTAL), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function goTo(idx: number) { resetTimer(idx) }

  function onTouchStart(e: React.TouchEvent) {
    e.stopPropagation()
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    e.stopPropagation()
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) resetTimer((slide + (diff > 0 ? 1 : -1) + TOTAL) % TOTAL)
    touchStartX.current = null
  }

  if (isLoading) return <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />

  const slides = [
    // Slide 0: 이번 주 지출
    {
      title: t('widget_week'),
      subtitle: tr.widget_week_range(data?.weekDays ?? 0),
      content: (
        <CurrencyList rows={data?.weekExpense ?? []} emptyLabel={t('widget_no_expense')} />
      ),
      accent: 'from-indigo-500/10 to-violet-500/10',
      dot: 'bg-indigo-500',
    },
    // Slide 1: 오늘 vs 어제
    {
      title: t('widget_today_vs_yesterday'),
      subtitle: '',
      content: (
        <div className="flex items-start gap-5">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">{t('widget_today')}</p>
            <CurrencyList rows={data?.todayExpense ?? []} emptyLabel={t('widget_no_expense')} />
          </div>
          <div className="w-px self-stretch bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-[10px] text-slate-400 mb-1">{t('widget_yesterday')}</p>
            <CurrencyList rows={data?.yesterdayExpense ?? []} emptyLabel={t('widget_no_expense')} />
          </div>
        </div>
      ),
      accent: 'from-rose-500/10 to-orange-500/10',
      dot: 'bg-rose-500',
    },
    // Slide 2: 일평균 비교
    {
      title: t('widget_daily_avg'),
      subtitle: '',
      content: (
        <div className="flex items-start gap-5">
          <div>
            <p className="text-[10px] text-slate-400 mb-1">{t('widget_this_month')}</p>
            <CurrencyList rows={(data?.monthDailyAvg ?? []).map(r => ({ ...r, amount: Math.round(r.amount) }))} emptyLabel={t('widget_no_expense')} />
          </div>
          <div className="w-px self-stretch bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-[10px] text-slate-400 mb-1">{t('widget_last_month')}</p>
            <CurrencyList rows={(data?.prevMonthDailyAvg ?? []).map(r => ({ ...r, amount: Math.round(r.amount) }))} emptyLabel={t('widget_no_expense')} />
          </div>
        </div>
      ),
      accent: 'from-emerald-500/10 to-teal-500/10',
      dot: 'bg-emerald-500',
    },
  ]

  const current = slides[slide]

  return (
    <div
      className={`relative select-none overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br ${current.accent} p-4 shadow-sm backdrop-blur-xl dark:border-slate-800/70`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Title row */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-200">{current.title}</p>
          {current.subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{current.subtitle}</p>}
        </div>
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === slide ? `w-4 h-2 ${s.dot}` : 'w-2 h-2 bg-slate-300 dark:bg-slate-600'}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[32px]">{current.content}</div>
    </div>
  )
}

type SummaryType = 'income' | 'expense' | 'neutral'

function SummaryCard({
  label,
  amount,
  type,
  icon,
  currency,
}: {
  label: string
  amount: number
  type: SummaryType
  icon: React.ReactNode
  currency: string
}) {
  const styles: Record<SummaryType, { bg: string; icon: string; amount: string }> = {
    expense: {
      bg: 'bg-gradient-to-br from-rose-50 via-white to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900/50',
      icon: 'text-white bg-rose-500 shadow-lg shadow-rose-500/20',
      amount: 'text-rose-600 dark:text-rose-400',
    },
    income: {
      bg: 'bg-gradient-to-br from-emerald-50 via-white to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900/50',
      icon: 'text-white bg-emerald-500 shadow-lg shadow-emerald-500/20',
      amount: 'text-emerald-600 dark:text-emerald-400',
    },
    neutral: {
      bg: 'bg-gradient-to-br from-slate-50 via-white to-white dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900/60',
      icon: 'text-white bg-slate-500 shadow-lg shadow-slate-500/20',
      amount: 'text-slate-700 dark:text-slate-300',
    },
  }

  const s = styles[type]
  const absAmount = Math.abs(amount)
  const displayAmount = absAmount >= 1_000_000
    ? formatCompactCurrency(absAmount, currency)
    : formatCurrency(absAmount, currency)

  return (
    <div className={`card rounded-3xl p-4 ${s.bg}`}>
      <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl ${s.icon}`}>
        {icon}
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-[clamp(1.15rem,4vw,1.8rem)] font-bold tracking-tight tabular-nums leading-none ${s.amount}`}>
        {displayAmount}
      </p>
    </div>
  )
}
