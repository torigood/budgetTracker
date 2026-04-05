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
import { formatCurrency, formatDateShort } from '@/utils/format'
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
    <div className="pb-6" {...swipe}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-400 font-medium">{t('dashboard_subtitle')}</p>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{t('dashboard_title')}</h1>
        </div>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </header>

      <div className="p-4 space-y-4">
        {/* 요약 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (data?.byCurrency ?? []).length > 1 ? (
          // Multi-currency: show one row per currency
          <div className="space-y-2">
            {(data?.byCurrency ?? []).map((row) => (
              <div key={row.currency} className="card px-4 py-3 grid grid-cols-4 gap-2 items-center">
                <span className="text-xs font-bold text-indigo-500">{row.currency}</span>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">{t('dashboard_expense')}</p>
                  <p className="text-xs font-bold text-rose-500 tabular-nums">{formatCurrency(row.expense, row.currency)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">{t('dashboard_income')}</p>
                  <p className="text-xs font-bold text-emerald-500 tabular-nums">{formatCurrency(row.income, row.currency)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">{t('dashboard_net')}</p>
                  <p className={`text-xs font-bold tabular-nums ${row.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
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
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              currency={data?.primaryCurrency ?? 'CAD'}
            />
            <SummaryCard
              label={t('dashboard_income')}
              amount={data?.totalIncome ?? 0}
              type="income"
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              currency={data?.primaryCurrency ?? 'CAD'}
            />
            <SummaryCard
              label={t('dashboard_net')}
              amount={data?.netBalance ?? 0}
              type={(data?.netBalance ?? 0) >= 0 ? 'income' : 'expense'}
              icon={<Minus className="h-3.5 w-3.5" />}
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
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('monthly_budget_title')}</p>
                <p className={`text-xs font-semibold tabular-nums ${isOver ? 'text-rose-500' : 'text-slate-400'}`}>
                  {isOver ? t('monthly_budget_over') : tr.monthly_budget_used(pct)}
                </p>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2">
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
          className="flex w-full items-center justify-between rounded-2xl bg-indigo-500 px-5 py-4 text-white shadow-md shadow-indigo-500/25 active:scale-[0.98] transition"
        >
          <div>
            <p className="text-xs font-medium text-indigo-200">{t('dashboard_add_prompt')}</p>
            <p className="text-sm font-semibold">{t('dashboard_add_desc')}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Plus className="h-5 w-5" />
          </span>
        </button>

        {/* 카테고리 도넛 차트 */}
        {!isLoading && data && data.categoryBreakdown.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('dashboard_category_chart')}</h2>
            <div className="flex items-center gap-4">
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
                      isAnimationActive={false}
                    >
                      {data.categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrency(v as number, data?.primaryCurrency ?? 'CAD')}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {data.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2">
                    <CategoryBadge color={cat.color} label={cat.name} size="sm" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                      {formatCurrency(cat.amount, data?.primaryCurrency ?? 'CAD')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 최근 거래 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('dashboard_recent')}</h2>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              <CalendarDays className="h-3 w-3" /> {t('dashboard_view_calendar')}
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
          ) : !data?.recentTransactions.length ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-400">{t('dashboard_empty')}</p>
              <button
                onClick={() => navigate('/transactions/new')}
                className="mt-2 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
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
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0 active:bg-slate-50 dark:active:bg-slate-800/40 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${cat?.color ?? '#6b7280'}18`,
                      color: cat?.color ?? '#6b7280',
                    }}
                  >
                    {cat?.name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{tx.description}</p>
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
      className={`relative rounded-2xl bg-gradient-to-br ${current.accent} border border-slate-100 dark:border-slate-800 p-4 overflow-hidden select-none`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{current.title}</p>
          {current.subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{current.subtitle}</p>}
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
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      icon: 'text-rose-500 bg-rose-100 dark:bg-rose-800/40',
      amount: 'text-rose-600 dark:text-rose-400',
    },
    income: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-800/40',
      amount: 'text-emerald-600 dark:text-emerald-400',
    },
    neutral: {
      bg: 'bg-slate-50 dark:bg-slate-800',
      icon: 'text-slate-500 bg-slate-100 dark:bg-slate-700',
      amount: 'text-slate-700 dark:text-slate-300',
    },
  }

  const s = styles[type]

  return (
    <div className={`rounded-2xl p-3 ${s.bg}`}>
      <div className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-lg ${s.icon}`}>
        {icon}
      </div>
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold tabular-nums leading-tight ${s.amount}`}>
        {formatCurrency(Math.abs(amount), currency)}
      </p>
    </div>
  )
}
