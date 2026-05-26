import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, Camera, RefreshCw, Settings, ArrowDownLeft, ArrowUpRight, WalletCards } from 'lucide-react'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useReminderCheck } from '@/lib/hooks/useNotifications'
import { useUIStore } from '@/lib/stores/ui.store'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { useT } from '@/lib/hooks/useT'
import { translations } from '@/lib/i18n'
import { useMonthlyBudget } from '@/lib/hooks/useMonthlyBudget'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CardSkeleton, TransactionSkeleton } from '@/components/ui/Skeleton'
import { ConvertedAmount } from '@/components/ui/ConvertedAmount'
import { Card } from '@/components/ui/Card'
import { BudgetProgressBars } from '@/components/ui/Charts'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'
import { convertAmount } from '@/lib/utils/currency'
import { formatCurrency } from '@/utils/format'

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth, lang, currency: defaultCurrency } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const { budget: monthlyBudget } = useMonthlyBudget(selectedMonth)
  useReminderCheck()
  const { data, isLoading } = useDashboard(selectedMonth)
  const { data: ratesData } = useExchangeRates(defaultCurrency)
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)
  const t = useT()
  const tr = translations[lang]

  const primaryCurrency = data?.primaryCurrency ?? 'CAD'
  const totalIncome = data?.totalIncome ?? 0
  const totalExpense = data?.totalExpense ?? 0
  const currentExpenseSamePoint = data?.currentExpenseSamePoint ?? 0
  const prevExpenseSamePoint = data?.prevExpenseSamePoint ?? 0
  const netBalance = data?.netBalance ?? 0
  const currentExpenseConverted = useMemo(() => {
    if (!ratesData?.rates || !data?.currentExpenseRowsSamePoint) return null
    return data.currentExpenseRowsSamePoint.reduce((sum, row) => {
      const converted = convertAmount(row.amount, row.currency, primaryCurrency, ratesData.rates, ratesData.base)
      return sum + (converted ?? 0)
    }, 0)
  }, [data?.currentExpenseRowsSamePoint, primaryCurrency, ratesData?.base, ratesData?.rates])
  const prevExpenseConverted = useMemo(() => {
    if (!ratesData?.rates || !data?.prevExpenseRows) return null
    return data.prevExpenseRows.reduce((sum, row) => {
      const converted = convertAmount(row.amount, row.currency, primaryCurrency, ratesData.rates, ratesData.base)
      return sum + (converted ?? 0)
    }, 0)
  }, [data?.prevExpenseRows, primaryCurrency, ratesData?.base, ratesData?.rates])

  const hasPrevRows = (data?.prevExpenseRows?.length ?? 0) > 0
  const prevExpenseForComparison = prevExpenseConverted ?? prevExpenseSamePoint
  const currentExpenseForComparison = currentExpenseConverted ?? currentExpenseSamePoint
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
      className: 'bg-[#dceee9] text-[#0b6f61]',
    },
    {
      key: 'receipt',
      icon: <Camera className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_scan'),
      to: '/receipt',
      className: 'bg-[#f4e3dc] text-[#c46f63]',
    },
    {
      key: 'calendar',
      icon: <CalendarDays className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_calendar'),
      to: '/calendar',
      className: 'bg-[#eee5d8] text-[#9a6b37]',
    },
    {
      key: 'recurring',
      icon: <RefreshCw className="h-[22px] w-[22px]" />,
      label: t('dashboard_action_recurring'),
      to: '/recurring',
      className: 'bg-[#e4ece6] text-[#688472]',
    },
  ] as const

  const firstSymbol = (text?: string | null) => {
    if (!text) return '?'
    const s = text.trim()
    if (!s) return '?'
    return Array.from(s)[0] ?? '?'
  }

  const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0
  const savingsDisplay = totalIncome > 0 ? `${savingsRate >= 0 ? '+' : ''}${savingsRate}%` : '-'
  const savingsClass = savingsRate >= 0 ? 'text-emerald-300' : 'text-rose-300'

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
      display: savingsDisplay,
      className: savingsClass,
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

  const expenseTransactions = useMemo(() => {
    return (data?.transactions ?? []).filter((tx) => tx.type === '지출')
  }, [data?.transactions])

  const totalSpentPrimary = expenseTransactions.reduce((sum, tx) => {
    const converted = convertAmount(tx.amount, tx.currency, primaryCurrency, ratesData?.rates, ratesData?.base)
    if (converted === null && tx.currency === primaryCurrency) return sum + tx.amount
    return sum + (converted ?? 0)
  }, 0)

  const displayCurrency = monthlyBudget ? monthlyBudget.currency : primaryCurrency

  const monthlyBudgetAmountDisplay = monthlyBudget
    ? (convertAmount(monthlyBudget.amount, monthlyBudget.currency, displayCurrency, ratesData?.rates, ratesData?.base)
        ?? (monthlyBudget.currency === displayCurrency ? monthlyBudget.amount : 0))
    : 0

  const totalSpentDisplay = displayCurrency === primaryCurrency
    ? totalSpentPrimary
    : (convertAmount(totalSpentPrimary, primaryCurrency, displayCurrency, ratesData?.rates, ratesData?.base) ?? 0)

  const budgetRemaining = Math.max(monthlyBudgetAmountDisplay - totalSpentDisplay, 0)
  const budgetUsedPct = monthlyBudgetAmountDisplay > 0
    ? Math.min(Math.round((totalSpentDisplay / monthlyBudgetAmountDisplay) * 100), 100)
    : 0
  const overviewItems = [
    {
      key: 'income',
      label: t('dashboard_income'),
      value: formatCurrency(totalIncome, primaryCurrency),
      icon: <ArrowDownLeft className="h-4 w-4" />,
      tone: 'bg-[#dceee9] text-[#0b6f61]',
    },
    {
      key: 'expense',
      label: t('dashboard_expense'),
      value: formatCurrency(totalExpense, primaryCurrency),
      icon: <ArrowUpRight className="h-4 w-4" />,
      tone: 'bg-[#f8e8e4] text-[#c46f63]',
    },
    {
      key: 'budget',
      label: lang === 'ko' ? '예산 사용' : 'Budget used',
      value: `${budgetUsedPct}%`,
      icon: <WalletCards className="h-4 w-4" />,
      tone: 'bg-[#eee5d8] text-[#9a6b37]',
    },
  ]

  return (
    <div className="pb-10" {...swipe}>
      <header className="fintra-page-header">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="fintra-pill mb-3">
              <span className="h-2 w-2 rounded-full bg-[#0b6f61]" />
              <span>Fintra</span>
            </div>
            <p className="fintra-kicker">{monthLabel}</p>
            <h1 className="fintra-page-title mt-1.5 leading-[1.25] tracking-[-0.01em] dark:text-white">
              {greetingText}
            </h1>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
          <button
            onClick={() => navigate('/settings')}
            className="fintra-icon-button h-11 min-h-11 w-11 min-w-11 shrink-0 hover:text-[#0b6f61] dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700/90"
            aria-label={t('nav_settings')}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="fintra-screen fintra-stack pt-2">
        <Card variant="soft" padding="md">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="fintra-kicker">{lang === 'ko' ? '월간 개요' : 'Monthly overview'}</p>
              <h2 className="mt-1 text-[1.12rem] font-semibold leading-tight text-[var(--fintra-charcoal)]">
                {lang === 'ko' ? '이번 달 흐름' : 'This month'}
              </h2>
            </div>
            <div className="rounded-full bg-[#dceee9] px-3 py-1.5 text-xs font-bold text-[#0b6f61]">
              {savingsRate > 0 ? '+' : ''}{savingsRate}%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {overviewItems.map((item) => (
              <div key={item.key} className="min-w-0 rounded-[1.35rem] border border-white/70 bg-white/82 px-3 py-3 shadow-[var(--fintra-shadow-soft)] dark:border-white/8 dark:bg-[#141a1f]/80">
                <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${item.tone}`}>
                  {item.icon}
                </span>
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fintra-ink-3)]">{item.label}</p>
                <p className="mt-1 truncate text-[0.88rem] font-bold tabular-nums text-[var(--fintra-charcoal)]">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Balance hero */}
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <Card variant="balance" padding="lg" className="dark:bg-[#063f39] dark:ring-white/10">
            <svg
              className="pointer-events-none absolute right-0 top-8 h-32 w-36 text-[#d7eadf]/85"
              viewBox="0 0 150 120"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 96C24 72 33 72 45 56C58 39 68 53 80 36C92 20 102 28 112 16C123 4 134 10 142 2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/62">{t('dashboard_total_balance')}</p>
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-semibold text-white/75">
                  {primaryCurrency}
                </span>
              </div>
              <p className="mt-2.5 text-[clamp(2.35rem,8.7vw,3.55rem)] font-semibold leading-none tabular-nums">
                {formatCurrency(Math.abs(netBalance), primaryCurrency)}
              </p>
              <ConvertedAmount
                amount={Math.abs(netBalance)}
                fromCurrency={primaryCurrency}
                className="mt-2 block text-[11px] text-white/58"
              />
              <div className="mt-6 grid grid-cols-3 gap-2.5 rounded-[1.55rem] bg-white/10 p-3.5">
                {summaryItems.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/56">{item.label}</p>
                    <p className={`mt-1 text-[0.96rem] font-semibold tabular-nums ${item.className}`}>
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
              <div className="mt-4 flex items-center justify-between rounded-full bg-black/8 px-3 py-2 text-xs text-white/70">
                <span>{t('dashboard_vs_last_month')}</span>
                <span className="font-semibold text-white">{deltaLabel}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Quick action buttons */}
        <div className="grid grid-cols-4 gap-1">
          {quickActions.map((action) => (
            <button
              key={action.key}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center justify-center gap-2 py-2 transition-all active:scale-95"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-[1.35rem] ${action.className}`}>
                {action.icon}
              </span>
              <span className="text-center text-[11px] font-semibold text-[var(--fintra-ink-2)] dark:text-slate-200">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Budget goals by category */}
        <div className="space-y-2">
          <div className="fintra-section-header pt-0.5">
            <h2 className="fintra-section-title dark:text-slate-200">{t('monthly_budget_title')}</h2>
            <button
              onClick={() => navigate('/settings/budget')}
              className="text-[12px] font-semibold text-[#0b6f61] transition-colors hover:text-[#063f39]"
            >
              {t('dashboard_view_all')}
            </button>
          </div>

          <Card variant="budget" padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="fintra-kicker">{t('monthly_budget_title')}</p>
                <p className="mt-1.5 text-[1.32rem] font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(totalSpentDisplay, displayCurrency)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {t('monthly_budget_used')(budgetUsedPct)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">{lang === 'ko' ? '예산' : 'Budget'}</p>
                <p className="mt-1 text-[1.05rem] font-semibold text-[#0b6f61] tabular-nums">
                  {monthlyBudgetAmountDisplay > 0
                    ? formatCurrency(monthlyBudgetAmountDisplay, displayCurrency)
                    : t('monthly_budget_no_limit')}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#0b6f61]">
                  {monthlyBudgetAmountDisplay > 0
                    ? t('monthly_budget_remaining')(formatCurrency(budgetRemaining, displayCurrency))
                    : t('monthly_budget_no_limit')}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBars
                data={[
                  {
                    id: 'monthly-budget',
                    label: lang === 'ko' ? '이번 달 사용량' : 'Monthly usage',
                    value: totalSpentDisplay,
                    limit: monthlyBudgetAmountDisplay,
                    tone: budgetUsedPct >= 90 ? 'coral' : budgetUsedPct >= 70 ? 'orange' : 'emerald',
                  },
                ]}
                formatValue={(value) => formatCurrency(value, displayCurrency)}
              />
            </div>
          </Card>
        </div>

        {/* 최근 거래 */}
        <div className="space-y-2">
          <div className="fintra-section-header pt-0.5">
            <h2 className="fintra-section-title dark:text-slate-200">{t('dashboard_recent')}</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-[12px] font-semibold text-[#0b6f61] transition-colors hover:text-[#063f39]"
            >
              {t('dashboard_view_all')}
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
          ) : !data?.recentTransactions.length ? (
            <Card variant="transaction" className="text-center" padding="lg">
              <p className="text-sm text-slate-400">{t('dashboard_empty')}</p>
              <button
                onClick={() => navigate('/transactions/new')}
                className="mt-3 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#dceee9] px-4 text-xs font-semibold text-[#0b6f61] transition-colors hover:bg-[#cde8e2] hover:text-[#063f39]"
              >
                {t('dashboard_add_first')}
              </button>
            </Card>
          ) : (
            <Card variant="transaction" padding="none" className="overflow-hidden">
              {data.recentTransactions.map((tx) => {
                const cat = tx.categories as { name: string; color: string; icon?: string | null } | null
                return (
                  <div
                    key={tx.id}
                    onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 transition-colors hover:bg-slate-50/70 active:bg-slate-100/70 dark:hover:bg-slate-800/30 dark:active:bg-slate-800/50"
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
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
