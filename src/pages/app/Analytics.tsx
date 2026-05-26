import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/useDashboard'
import { useAnnualReport } from '@/lib/hooks/useAnnualReport'
import { useUIStore } from '@/lib/stores/ui.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { useT } from '@/lib/hooks/useT'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'
import { convertAmount } from '@/lib/utils/currency'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ConvertedAmount } from '@/components/ui/ConvertedAmount'
import { Card } from '@/components/ui/Card'
import { DonutChart, MonthlyBarChart, SpendingTrendLineGraph } from '@/components/ui/Charts'
import { formatCompactAmount, formatCurrency, getMonthShortLabel } from '@/utils/format'
import type { AnnualMonth } from '@/lib/hooks/useAnnualReport'
import type { TranslationFn } from '@/lib/i18n'

export default function Analytics() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth, lang, currency: fallbackCurrency } = useUIStore()
  const [tab, setTab] = useState<'monthly' | 'annual'>('monthly')
  const [annualYear, setAnnualYear] = useState(() => new Date().getFullYear())
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)
  const { data: months, isLoading } = useAnalytics(selectedMonth)
  const { data: annualData, isLoading: annualLoading } = useAnnualReport(annualYear)
  const { data: ratesData } = useExchangeRates(fallbackCurrency)
  const t = useT()

  const TOTAL_KEY = '__total__'

  const current = months?.at(-1)
  const previous = months?.at(-2)

  const availableCurrencies = Array.from(
    new Set((months ?? []).flatMap((m) => m.rows.map((r) => r.currency ?? 'CAD')))
  )
  const preferredCurrency = current?.primaryCurrency ?? fallbackCurrency

  useEffect(() => {
    if (!availableCurrencies.length) {
      setSelectedCurrency(null)
      return
    }
    if (selectedCurrency && (availableCurrencies.includes(selectedCurrency) || selectedCurrency === TOTAL_KEY)) return
    const next = availableCurrencies.includes(preferredCurrency)
      ? preferredCurrency
      : availableCurrencies[0]
    setSelectedCurrency(next)
  }, [availableCurrencies, preferredCurrency, selectedCurrency])

  const isTotal = selectedCurrency === TOTAL_KEY
  const analyticsCurrency = isTotal ? fallbackCurrency : (selectedCurrency ?? preferredCurrency)
  const systemCurrency = fallbackCurrency

  const convertRow = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount
    if (!ratesData?.rates) return 0
    return convertAmount(amount, fromCurrency, toCurrency, ratesData.rates, ratesData.base) ?? 0
  }

  const monthlySeries = (months ?? []).map((m) => {
    const expense = m.rows
      .filter((r) => r.type === '지출')
      .reduce((s, r) => {
        const cur = r.currency ?? 'CAD'
        return s + (isTotal ? convertRow(r.amount, cur, analyticsCurrency) : (cur === analyticsCurrency ? r.amount : 0))
      }, 0)
    const income = m.rows
      .filter((r) => r.type === '수입')
      .reduce((s, r) => {
        const cur = r.currency ?? 'CAD'
        return s + (isTotal ? convertRow(r.amount, cur, analyticsCurrency) : (cur === analyticsCurrency ? r.amount : 0))
      }, 0)
    return {
      month: m.month,
      expense,
      income,
    }
  })

  const currentSeries = monthlySeries.at(-1)
  const previousSeries = monthlySeries.at(-2)
  const sixMonthSeries = monthlySeries.slice(-6)
  const currentExpense = currentSeries?.expense ?? 0
  const currentIncome = currentSeries?.income ?? 0
  const currentNet = currentIncome - currentExpense

  const expenseDiff = currentSeries && previousSeries && previousSeries.expense > 0
    ? ((currentSeries.expense - previousSeries.expense) / previousSeries.expense) * 100
    : null
  const expenseDiffAmount = currentSeries && previousSeries
    ? currentSeries.expense - previousSeries.expense
    : null

  const categoryMap: Record<string, { name: string; color: string; amount: number }> = {}
  current?.rows
    .filter((r) => r.type === '지출' && (isTotal || (r.currency ?? 'CAD') === analyticsCurrency))
    .forEach((r) => {
    const cat = r.categories as { name: string; color: string } | null
    if (!cat || !r.category_id) return
    const amt = isTotal ? convertRow(r.amount, r.currency ?? 'CAD', analyticsCurrency) : r.amount
    if (!categoryMap[r.category_id]) categoryMap[r.category_id] = { name: cat.name, color: cat.color, amount: 0 }
    categoryMap[r.category_id].amount += amt
  })
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount)

  const expenseKey = t('analytics_expense')
  const incomeKey = t('analytics_income')
  const reportsTitle = lang === 'ko' ? '리포트' : 'Reports'
  const annualConverted = useMemo(() => {
    const monthMap: Record<string, AnnualMonth> = {}
    for (let m = 1; m <= 12; m++) {
      const key = `${annualYear}-${String(m).padStart(2, '0')}`
      monthMap[key] = { month: key, expense: 0, income: 0 }
    }

    ;(annualData?.rows ?? []).forEach((row) => {
      const key = row.date.slice(0, 7)
      if (!monthMap[key]) return
      const converted = convertRow(row.amount, row.currency ?? 'CAD', systemCurrency)
      if (row.type === '지출') monthMap[key].expense += converted
      else monthMap[key].income += converted
    })

    const months = Object.values(monthMap)
    const totalExpense = months.reduce((s, m) => s + m.expense, 0)
    const totalIncome = months.reduce((s, m) => s + m.income, 0)

    return { months, totalExpense, totalIncome, currency: systemCurrency }
  }, [annualData?.rows, annualYear, systemCurrency, ratesData?.rates, ratesData?.base])

  const summaryCurrency = tab === 'annual'
    ? annualConverted.currency
    : analyticsCurrency
  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  })()

  return (
    <div className="pb-6" {...(tab === 'monthly' ? swipe : {})}>
      <header className="fintra-page-header">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="fintra-icon-button mt-0.5 h-10 min-w-10 w-10 shrink-0 rounded-2xl shadow-[var(--fintra-shadow-soft)] dark:hover:bg-slate-800"
              aria-label="홈으로"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="fintra-kicker truncate">{monthLabel}</p>
              <h1 className="fintra-page-title mt-1 whitespace-nowrap dark:text-white">
                {reportsTitle}
              </h1>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-2">
          {tab === 'monthly' && <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
          <button
            onClick={() => navigate('/settings')}
            className="fintra-icon-button h-10 w-10 rounded-2xl hover:text-[#0b6f61] dark:hover:bg-slate-800"
            aria-label={t('nav_settings')}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="mx-4 mt-2 mb-1 flex gap-1 rounded-[1.6rem] border border-white/85 bg-white p-1 shadow-[var(--fintra-shadow-quiet)] dark:border-slate-800/70 dark:bg-slate-900/80">
        <button
          onClick={() => setTab('monthly')}
          className={`tap-target flex-1 rounded-[1.15rem] py-2.5 text-sm font-semibold transition active:scale-95 ${tab === 'monthly' ? 'bg-[#0b6f61] text-white shadow-[0_10px_22px_rgba(11,111,97,0.16)]' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {t('analytics_tab_monthly')}
        </button>
        <button
          onClick={() => setTab('annual')}
          className={`tap-target flex-1 rounded-[1.15rem] py-2.5 text-sm font-semibold transition active:scale-95 ${tab === 'annual' ? 'bg-[#0b6f61] text-white shadow-[0_10px_22px_rgba(11,111,97,0.16)]' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {t('analytics_tab_annual')}
        </button>
      </div>

      <div className="mx-4 mt-3 grid grid-cols-3 gap-2.5">
        {[
          {
            label: expenseKey,
            amount: tab === 'annual' ? (annualData?.totalExpense ?? 0) : currentExpense,
            color: 'text-[#c46f63]',
            bg: 'bg-[#f8e8e4]',
          },
          {
            label: incomeKey,
            amount: tab === 'annual' ? (annualData?.totalIncome ?? 0) : currentIncome,
            color: 'text-[#0b6f61]',
            bg: 'bg-[#dceee9]',
          },
          {
            label: lang === 'ko' ? '순 흐름' : 'Net flow',
            amount: tab === 'annual' ? ((annualData?.totalIncome ?? 0) - (annualData?.totalExpense ?? 0)) : currentNet,
            color: (tab === 'annual' ? ((annualData?.totalIncome ?? 0) - (annualData?.totalExpense ?? 0)) : currentNet) >= 0 ? 'text-[#0b6f61]' : 'text-[#c46f63]',
            bg: 'bg-white',
          },
        ].map((item) => (
          <div key={item.label} className={`min-w-0 rounded-[1.45rem] px-3 py-3 shadow-[var(--fintra-shadow-soft)] ${item.bg}`}>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className={`mt-1 truncate text-[0.9rem] font-bold tabular-nums ${item.color}`}>
              {formatCurrency(Math.abs(item.amount), summaryCurrency)}
            </p>
          </div>
        ))}
      </div>

      {tab === 'annual' ? (
        <AnnualReport
          year={annualYear}
          onYearChange={setAnnualYear}
          data={annualConverted}
          isLoading={annualLoading}
          lang={lang}
          t={t}
          expenseKey={expenseKey}
          incomeKey={incomeKey}
        />
      ) : (
        <div className="fintra-screen fintra-stack">
          {availableCurrencies.length > 1 && (
            <Card variant="settings" padding="sm">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {t('settings_currency_title')}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setSelectedCurrency(cur)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      !isTotal && cur === analyticsCurrency
                        ? 'bg-[#0d8a7a] text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedCurrency(TOTAL_KEY)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isTotal
                      ? 'bg-[#0d8a7a] text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {lang === 'ko' ? '합계' : 'Total'}
                </button>
              </div>
              {isTotal && (
                <p className="mt-2 text-[11px] text-slate-400">
                  {lang === 'ko' ? `모든 통화를 ${analyticsCurrency}로 환산` : `All currencies converted to ${analyticsCurrency}`}
                </p>
              )}
              {!isTotal && <p className="mt-2 text-[11px] text-slate-400">{t('analytics_annual_currency_note')}</p>}
            </Card>
          )}

          {/* 전월 대비 배너 */}
          {!isLoading && expenseDiff !== null && (
            <div className={`flex items-center gap-3 rounded-[2rem] border border-white/70 px-4 py-4 shadow-[var(--fintra-shadow-soft)] ${
              expenseDiff >= 0
                ? 'bg-rose-50/80 dark:border-slate-800/70 dark:bg-rose-950/30'
                : 'bg-emerald-50/80 dark:border-slate-800/70 dark:bg-emerald-950/30'
            }`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                expenseDiff >= 0
                    ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                {expenseDiff >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </span>
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('analytics_vs_last')}</p>
                <p className={`text-sm font-bold ${expenseDiff >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(1)}%{' '}
                  <span className="font-normal text-xs text-slate-400">
                    {expenseDiff >= 0 ? t('analytics_more') : t('analytics_less')}
                  </span>
                  {expenseDiffAmount !== null && (
                    <span className="ml-1.5 font-semibold tabular-nums">
                      ({expenseDiffAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(expenseDiffAmount), analyticsCurrency)})
                      <ConvertedAmount amount={Math.abs(expenseDiffAmount)} fromCurrency={analyticsCurrency} className="ml-1" />
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          <Card variant="analytics" padding="md">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="fintra-kicker">{lang === 'ko' ? '최근 6개월' : 'Last 6 months'}</p>
                <h2 className="mt-1 text-sm font-semibold text-[var(--fintra-charcoal)] dark:text-slate-300">{lang === 'ko' ? '지출 흐름' : 'Spending trend'}</h2>
              </div>
              <span className="rounded-full bg-[#dceee9] px-2.5 py-1 text-[10px] font-bold text-[#0b6f61]">
                {isTotal ? (lang === 'ko' ? `합계 · ${analyticsCurrency}` : `Total · ${analyticsCurrency}`) : analyticsCurrency}
              </span>
            </div>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <SpendingTrendLineGraph
                  data={sixMonthSeries.map((m) => ({
                    label: getMonthShortLabel(m.month, lang),
                    value: m.expense,
                  }))}
                  formatValue={(value) => formatCompactAmount(value, analyticsCurrency)}
                />
              </div>
            )}
          </Card>

          <Card variant="analytics" padding="md">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="fintra-kicker">{lang === 'ko' ? '비교' : 'Comparison'}</p>
                <h2 className="mt-1 text-sm font-semibold text-[var(--fintra-charcoal)] dark:text-slate-300">{lang === 'ko' ? '수입 vs 지출' : 'Income vs expense'}</h2>
              </div>
            </div>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <MonthlyBarChart
                  data={sixMonthSeries.map((m) => ({
                    label: getMonthShortLabel(m.month, lang),
                    expense: m.expense,
                    income: m.income,
                  }))}
                  formatValue={(value) => formatCompactAmount(value, analyticsCurrency)}
                />
              </div>
            )}
            {!isLoading && (
              <div className="mt-3 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ec8b83]" />{expenseKey}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0b6f61]" />{incomeKey}
                </span>
              </div>
            )}
          </Card>

          {!isLoading && categoryBreakdown.length > 0 && (
            <Card variant="analytics" padding="md">
              <div className="mb-4">
                <p className="fintra-kicker">{lang === 'ko' ? '카테고리' : 'Category'}</p>
                <h2 className="mt-1 text-sm font-semibold text-[var(--fintra-charcoal)] dark:text-slate-300">{t('analytics_category')}</h2>
              </div>
              <DonutChart
                data={categoryBreakdown.map((cat) => ({
                  id: cat.id,
                  name: cat.name,
                  amount: cat.amount,
                  color: cat.color,
                }))}
                totalLabel={expenseKey}
                formatValue={(value) => formatCurrency(value, analyticsCurrency)}
              />
            </Card>
          )}

          {!isLoading && categoryBreakdown.length > 0 && (
            <Card variant="analytics" padding="md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="fintra-kicker">{lang === 'ko' ? '랭킹' : 'Ranking'}</p>
                  <h2 className="mt-1 text-sm font-semibold text-[var(--fintra-charcoal)] dark:text-slate-300">{lang === 'ko' ? '카테고리 순위' : 'Category ranking'}</h2>
                </div>
                <span className="text-xs font-semibold text-[var(--fintra-ink-3)]">TOP {Math.min(categoryBreakdown.length, 5)}</span>
              </div>
              <div className="space-y-3">
                {categoryBreakdown.slice(0, 5).map((cat, index) => {
                  const max = categoryBreakdown[0]?.amount ?? 1
                  const pct = max > 0 ? Math.max((cat.amount / max) * 100, 4) : 0
                  return (
                    <div key={cat.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f6f8] text-[11px] font-bold text-[var(--fintra-ink-2)]">
                            {index + 1}
                          </span>
                          <span className="truncate text-sm font-semibold text-[var(--fintra-charcoal)]">{cat.name}</span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--fintra-ink-2)]">
                          {formatCurrency(cat.amount, analyticsCurrency)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#edf1ef]">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Annual Report ────────────────────────────────────────────────────────────

function AnnualReport({
  year,
  onYearChange,
  data,
  isLoading,
  lang,
  t,
  expenseKey,
  incomeKey,
}: {
  year: number
  onYearChange: (y: number) => void
  data: { months: AnnualMonth[]; totalExpense: number; totalIncome: number; currency: string } | undefined
  isLoading: boolean
  lang: string
  t: TranslationFn
  expenseKey: string
  incomeKey: string
}) {
  const net = (data?.totalIncome ?? 0) - (data?.totalExpense ?? 0)
  const currency = data?.currency ?? 'CAD'

  return (
    <div className="p-4 space-y-4">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onYearChange(year - 1)}
          className="tap-target flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] transition hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums w-16 text-center">{year}</span>
        <button
          onClick={() => onYearChange(year + 1)}
          disabled={year >= new Date().getFullYear()}
          className="tap-target flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] transition hover:bg-slate-100 disabled:opacity-30 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 p-3">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">{t('analytics_annual_total_expense')}</p>
            <p className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400 leading-tight">
              {formatCurrency(data?.totalExpense ?? 0, currency)}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">{t('analytics_annual_total_income')}</p>
            <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight">
              {formatCurrency(data?.totalIncome ?? 0, currency)}
            </p>
          </div>
          <div className={`rounded-2xl p-3 ${net >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">{t('analytics_annual_net')}</p>
            <p className={`text-sm font-bold tabular-nums leading-tight ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(Math.abs(net), currency)}
            </p>
          </div>
        </div>
      )}

      {/* 12-month bar chart */}
      <Card variant="analytics" padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('analytics_annual_trend')}</h2>
          <span className="text-[10px] text-slate-400">{t('analytics_annual_currency_note')} · {currency}</span>
        </div>
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <MonthlyBarChart
              data={(data?.months ?? []).map((m) => ({
                label: getMonthShortLabel(m.month, lang),
                expense: m.expense,
                income: m.income,
              }))}
              formatValue={(value) => formatCompactAmount(value, currency)}
            />
          </div>
        )}
        {!isLoading && (
          <div className="mt-3 flex items-center gap-4 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ec8b83]" />{expenseKey}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0b6f61]" />{incomeKey}
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}
