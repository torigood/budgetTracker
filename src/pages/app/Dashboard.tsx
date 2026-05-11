import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, Camera, RefreshCw, Settings } from 'lucide-react'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useReminderCheck } from '@/lib/hooks/useNotifications'
import { useUIStore } from '@/lib/stores/ui.store'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { useT } from '@/lib/hooks/useT'
import { translations } from '@/lib/i18n'
import { useBudgetGoals } from '@/lib/hooks/useBudgetGoals'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CardSkeleton, TransactionSkeleton } from '@/components/ui/Skeleton'
import { ConvertedAmount } from '@/components/ui/ConvertedAmount'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'
import { convertAmount } from '@/lib/utils/currency'
import { formatCurrency } from '@/utils/format'

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth, lang, currency: defaultCurrency } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const { goals } = useBudgetGoals()
  useReminderCheck()
  const { data, isLoading } = useDashboard(selectedMonth)
  const { data: ratesData } = useExchangeRates(defaultCurrency)
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)
  const t = useT()
  const tr = translations[lang]

  const primaryCurrency = data?.primaryCurrency ?? 'CAD'
  const totalIncome = data?.totalIncome ?? 0
  const totalExpense = data?.totalExpense ?? 0
  const prevExpenseSamePoint = data?.prevExpenseSamePoint ?? 0
  const netBalance = data?.netBalance ?? 0
  const prevExpenseConverted = useMemo(() => {
    if (!ratesData?.rates || !data?.prevExpenseRows) return null
    return data.prevExpenseRows.reduce((sum, row) => {
      const converted = convertAmount(row.amount, row.currency, primaryCurrency, ratesData.rates, ratesData.base)
      return sum + (converted ?? 0)
    }, 0)
  }, [data?.prevExpenseRows, primaryCurrency, ratesData?.base, ratesData?.rates])

  const hasPrevRows = (data?.prevExpenseRows?.length ?? 0) > 0
  const prevExpenseForComparison = prevExpenseConverted ?? prevExpenseSamePoint
  const currentExpenseForComparison = totalExpense
  const hasPrevComparison = hasPrevRows && prevExpenseForComparison > 0
  const monthDeltaPct = hasPrevComparison
    ? Math.round(((prevExpenseForComparison - currentExpenseForComparison) / prevExpenseForComparison) * 100)
    : 0
  const isSpendingLess = hasPrevComparison && monthDeltaPct > 0
  const isSpendingMore = hasPrevComparison && monthDeltaPct < 0
  const deltaClass = isSpendingLess ? 'text-emerald-300' : isSpendingMore ? 'text-rose-300' : 'text-slate-300'
  const deltaDisplay = hasPrevComparison ? `${monthDeltaPct > 0 ? '+' : ''}${monthDeltaPct}%` : '-'
  const deltaLabel = useMemo(() => {
    const absPct = Math.abs(monthDeltaPct)
    if (!hasPrevRows) return t('dashboard_vs_last_month_no_data')
    if (monthDeltaPct === 0) return t('dashboard_vs_last_month_same')
    return isSpendingLess ? tr.dashboard_vs_last_month_less(absPct) : tr.dashboard_vs_last_month_more(absPct)
  }, [hasPrevRows, isSpendingLess, monthDeltaPct, t, tr])

  const quickActions = [
    {
      key: 'add',
      icon: <Plus className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_add'),
      to: '/transactions/new',
      className: 'text-[#0d8a7a]',
    },
    {
      key: 'receipt',
      icon: <Camera className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_scan'),
      to: '/receipt',
      className: 'text-[#0d8a7a]',
    },
    {
      key: 'calendar',
      icon: <CalendarDays className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_calendar'),
      to: '/calendar',
      className: 'text-[#0d8a7a]',
    },
    {
      key: 'recurring',
      icon: <RefreshCw className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_recurring'),
      to: '/recurring',
      className: 'text-[#0d8a7a]',
    },
  ] as const

  const summaryItems = [
    {
      label: t('dashboard_income'),
      display: formatCurrency(totalIncome, primaryCurrency),
      className: 'text-emerald-300',
      amount: totalIncome,
      currency: primaryCurrency,
    },
    {
      label: t('dashboard_expense'),
      display: formatCurrency(totalExpense, primaryCurrency),
      className: 'text-rose-300',
      amount: totalExpense,
      currency: primaryCurrency,
    },
    {
      label: t('dashboard_saved'),
      display: deltaDisplay,
      className: deltaClass,
    },
  ]

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return date.toLocaleString(lang === 'ko' ? 'en-US' : 'en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  })()

  const userName = (() => {
    const fallback = 'there'
    const raw = user?.user_metadata?.name as string | undefined
    if (raw && raw.trim()) return raw.trim()
    if (user?.email) return user.email.split('@')[0]
    return fallback
  })()

  const greetingText = (() => {
    const hour = new Date().getHours()

    if (lang === 'ko') {
      if (hour >= 5 && hour < 11) return `좋은 아침, ${userName}`
      if (hour >= 11 && hour < 15) return `좋은 점심, ${userName}`
      if (hour >= 15 && hour < 21) return `좋은 저녁, ${userName}`
      if (hour >= 21 && hour < 24) return `늦은 밤이네요, ${userName}`
      return `새벽에도 반가워요, ${userName}`
    }

    if (hour >= 5 && hour < 11) return `Good morning, ${userName}`
    if (hour >= 11 && hour < 15) return `Good lunch time, ${userName}`
    if (hour >= 15 && hour < 21) return `Good evening, ${userName}`
    if (hour >= 21 && hour < 24) return `Late night, ${userName}`
    return `Early dawn, ${userName}`
  })()

  const budgetGoalRows = (data?.categoryBreakdown ?? [])
    .map((cat) => {
      const goal = goals[cat.id]
      if (!goal) return null
      const spent = cat.amount
      const pct = Math.min(Math.round((spent / goal.amount) * 100), 100)
      const left = Math.max(goal.amount - spent, 0)
      return {
        ...cat,
        goal,
        spent,
        pct,
        left,
      }
    })
    .filter((row): row is NonNullable<typeof row> => !!row)

  const firstSymbol = (text?: string | null) => {
    if (!text) return '?'
    const s = text.trim()
    if (!s) return '?'
    return Array.from(s)[0] ?? '?'
  }

  const getConvertedLabel = (amount: number, currency: string) => {
    if (currency === defaultCurrency) return null
    const converted = convertAmount(amount, currency, defaultCurrency, ratesData?.rates, ratesData?.base)
    if (converted === null) return null
    return formatCurrency(converted, defaultCurrency)
  }

  return (
    <div className="pb-8 pt-1.5" {...swipe}>
      <header className="mx-4 rounded-[1.6rem] px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{monthLabel}</p>
            <h1 className="mt-1 text-[1.82rem] leading-[1.08] font-semibold tracking-tight text-slate-950 dark:text-white">
              {greetingText}
            </h1>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex h-13 w-13 items-center justify-center rounded-3xl border border-slate-200/90 bg-white text-slate-500 shadow-sm transition hover:text-[#0d8a7a] dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700/90"
            aria-label={t('nav_settings')}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
        </div>
      </header>

      <div className="space-y-3.5 px-4 py-4">
        {/* Balance hero */}
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="relative overflow-hidden rounded-[1.8rem] bg-[#031113] px-4.5 py-4.5 text-white shadow-[0_20px_56px_rgba(0,0,0,0.18)] ring-1 ring-black/5 dark:bg-[linear-gradient(140deg,#0b141d_0%,#050a10_100%)] dark:ring-white/10 dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
            <div className="absolute right-[-1rem] top-[-1rem] h-24 w-24 rounded-full bg-white/6 blur-[1px] dark:bg-cyan-300/10" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">{t('dashboard_total_balance')}</p>
              <p className="mt-1.5 text-[clamp(1.9rem,6.3vw,3rem)] font-semibold leading-none tracking-tight tabular-nums">
                {formatCurrency(Math.abs(netBalance), primaryCurrency)}
              </p>
              <ConvertedAmount
                amount={Math.abs(netBalance)}
                fromCurrency={primaryCurrency}
                className="mt-1 block text-[11px] text-white/55"
              />
              <div className="mt-5 grid grid-cols-3 gap-2.5 border-t border-white/15 pt-3.5">
                {summaryItems.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">{item.label}</p>
                    <p className={`mt-1 text-[0.92rem] font-semibold tabular-nums ${item.className}`}>
                      {item.display}
                    </p>
                    {item.amount !== undefined && item.currency && (
                      <ConvertedAmount
                        amount={item.amount}
                        fromCurrency={item.currency}
                        className="mt-0.5 block text-[10px] text-white/55"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                <span>{t('dashboard_vs_last_month')}</span>
                <span className={deltaClass}>{deltaLabel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Multi-currency rows stay available beneath the hero when needed */}
        {!isLoading && (data?.byCurrency ?? []).length > 1 && (
          <div className="space-y-3">
            {(data?.byCurrency ?? []).map((row) => (
              <div key={row.currency} className="card grid grid-cols-4 items-center gap-2 rounded-[1.65rem] bg-white/92 px-4 py-4 shadow-sm">
                <span className="text-xs font-bold tracking-[0.18em] text-[#0f6f73]">{row.currency}</span>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('dashboard_expense')}</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-rose-500">{formatCurrency(row.expense, row.currency)}</p>
                  <ConvertedAmount amount={row.expense} fromCurrency={row.currency} className="mt-0.5 block" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('dashboard_income')}</p>
                  <p className="mt-1 text-sm font-bold tabular-nums text-emerald-500">{formatCurrency(row.income, row.currency)}</p>
                  <ConvertedAmount amount={row.income} fromCurrency={row.currency} className="mt-0.5 block" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('dashboard_net')}</p>
                  <p className={`mt-1 text-sm font-bold tabular-nums ${row.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(Math.abs(row.net), row.currency)}
                  </p>
                  <ConvertedAmount amount={Math.abs(row.net)} fromCurrency={row.currency} className="mt-0.5 block" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="grid grid-cols-4 gap-2.5">
          {quickActions.map((action) => (
            <button
              key={action.key}
              onClick={() => navigate(action.to)}
              className="flex min-h-[82px] flex-col items-center justify-center rounded-3xl border border-slate-200/95 bg-slate-50 px-2 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all active:scale-95 dark:border-slate-700 dark:bg-slate-800/70"
            >
              <span className={`mb-1.5 flex items-center justify-center ${action.className}`}>
                {action.icon}
              </span>
              <span className="text-center text-[11px] font-semibold tracking-[0.01em] text-slate-700 dark:text-slate-200">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Budget goals by category */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 pt-0.5">
            <h2 className="text-[1.08rem] leading-none font-semibold tracking-tight text-slate-800 dark:text-slate-200">{t('monthly_budget_title')}</h2>
            <button
              onClick={() => navigate('/settings/budget')}
              className="text-[12px] font-semibold text-[#0d8a7a] transition-colors hover:text-[#0a7568]"
            >
              {t('dashboard_view_all')}
            </button>
          </div>

          {!budgetGoalRows.length ? (
            <div className="card rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <p className="text-sm font-semibold text-slate-700">{t('dashboard_budget_set_prompt')}</p>
              <p className="mt-1 text-xs text-slate-400">{t('dashboard_budget_set_desc')}</p>
              <button
                onClick={() => navigate('/settings/budget')}
                className="mt-3 rounded-full bg-[#dbefeb] px-3 py-1.5 text-xs font-semibold text-[#0d8a7a]"
              >
                {t('dashboard_budget_set_cta')}
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden rounded-3xl border border-slate-200/90">
              {budgetGoalRows.map((row) => (
                <div key={row.id} className="border-b border-slate-100 px-4 py-2.5 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                      style={{ backgroundColor: `${row.color}20`, color: row.color }}
                    >
                      {(() => {
                        const rawIcon = row.icon?.trim() ?? ''
                        return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : firstSymbol(row.name)
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[0.9rem] font-semibold text-slate-900">{row.name}</p>
                        <div className="shrink-0 max-w-[52%] text-right text-[0.8rem] font-semibold text-slate-500 tabular-nums leading-tight">
                          <span className="block break-all">{formatCurrency(row.spent, row.goal.currency)}</span>
                          <span className="block break-all text-slate-400">/ {formatCurrency(row.goal.amount, row.goal.currency)}</span>
                          {getConvertedLabel(row.spent, row.goal.currency) && getConvertedLabel(row.goal.amount, row.goal.currency) && (
                            <span className="mt-0.5 block break-all text-[0.7rem] text-slate-400">
                              {getConvertedLabel(row.spent, row.goal.currency)} / {getConvertedLabel(row.goal.amount, row.goal.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 거래 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 pt-0.5">
            <h2 className="text-[1.08rem] leading-none font-semibold tracking-tight text-slate-800 dark:text-slate-200">{t('dashboard_recent')}</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-[12px] font-semibold text-[#0d8a7a] transition-colors hover:text-[#0a7568]"
            >
              {t('dashboard_view_all')}
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
          ) : !data?.recentTransactions.length ? (
            <div className="card rounded-3xl px-4 py-12 text-center">
              <p className="text-sm text-slate-400">{t('dashboard_empty')}</p>
              <button
                onClick={() => navigate('/transactions/new')}
                className="mt-3 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#dbefeb] px-4 text-xs font-semibold text-[#0d8a7a] transition-colors hover:bg-[#cde8e2] hover:text-[#0a7568]"
              >
                {t('dashboard_add_first')}
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden rounded-3xl border border-slate-200/90">
              {data.recentTransactions.map((tx) => {
                const cat = tx.categories as { name: string; color: string; icon?: string | null } | null
                return (
                  <div
                    key={tx.id}
                    onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 transition-colors hover:bg-slate-50/70 active:bg-slate-100/70 dark:hover:bg-slate-800/30 dark:active:bg-slate-800/50"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                      style={{
                        backgroundColor: `${cat?.color ?? '#6b7280'}18`,
                        color: cat?.color ?? '#6b7280',
                      }}
                    >
                      {(() => {
                        const rawIcon = cat?.icon?.trim() ?? ''
                        return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : firstSymbol(cat?.name)
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.82rem] font-semibold text-slate-900 dark:text-white">{tx.description}</p>
                      <p className="text-[0.72rem] text-slate-400">{cat?.name ?? '-'}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`block text-[0.95rem] font-semibold tabular-nums ${
                        tx.type === '지출' ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <ConvertedAmount amount={tx.amount} fromCurrency={tx.currency} className="mt-0.5 block" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

