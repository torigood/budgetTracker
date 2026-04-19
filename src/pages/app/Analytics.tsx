import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/useDashboard'
import { useAnnualReport } from '@/lib/hooks/useAnnualReport'
import { useUIStore } from '@/lib/stores/ui.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { useT } from '@/lib/hooks/useT'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCompactAmount, formatCurrency, getMonthShortLabel } from '@/utils/format'
import type { AnnualMonth } from '@/lib/hooks/useAnnualReport'
import type { TranslationKey } from '@/lib/i18n'

export default function Analytics() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth, lang, currency: fallbackCurrency } = useUIStore()
  const [tab, setTab] = useState<'monthly' | 'annual'>('monthly')
  const [annualYear, setAnnualYear] = useState(() => new Date().getFullYear())
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const swipe = useSwipeMonth(selectedMonth, setSelectedMonth)
  const { data: months, isLoading } = useAnalytics(selectedMonth)
  const { data: annualData, isLoading: annualLoading } = useAnnualReport(annualYear)
  const t = useT()

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
    if (selectedCurrency && availableCurrencies.includes(selectedCurrency)) return
    const next = availableCurrencies.includes(preferredCurrency)
      ? preferredCurrency
      : availableCurrencies[0]
    setSelectedCurrency(next)
  }, [availableCurrencies, preferredCurrency, selectedCurrency])

  const analyticsCurrency = selectedCurrency ?? preferredCurrency

  const monthlySeries = (months ?? []).map((m) => {
    const expense = m.rows
      .filter((r) => (r.currency ?? 'CAD') === analyticsCurrency && r.type === '지출')
      .reduce((s, r) => s + r.amount, 0)
    const income = m.rows
      .filter((r) => (r.currency ?? 'CAD') === analyticsCurrency && r.type === '수입')
      .reduce((s, r) => s + r.amount, 0)
    return {
      month: m.month,
      expense,
      income,
    }
  })

  const currentSeries = monthlySeries.at(-1)
  const previousSeries = monthlySeries.at(-2)

  const expenseDiff = currentSeries && previousSeries && previousSeries.expense > 0
    ? ((currentSeries.expense - previousSeries.expense) / previousSeries.expense) * 100
    : null
  const expenseDiffAmount = currentSeries && previousSeries
    ? currentSeries.expense - previousSeries.expense
    : null

  const categoryMap: Record<string, { name: string; color: string; amount: number }> = {}
  current?.rows
    .filter((r) => r.type === '지출' && (r.currency ?? 'CAD') === analyticsCurrency)
    .forEach((r) => {
    const cat = r.categories as { name: string; color: string } | null
    if (!cat || !r.category_id) return
    if (!categoryMap[r.category_id]) categoryMap[r.category_id] = { name: cat.name, color: cat.color, amount: 0 }
    categoryMap[r.category_id].amount += r.amount
  })
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount)

  const totalExpense = categoryBreakdown.reduce((s, c) => s + c.amount, 0)

  const expenseKey = t('analytics_expense')
  const incomeKey = t('analytics_income')
  const reportsTitle = lang === 'ko' ? '리포트' : 'Reports'
  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  })()

  return (
    <div className="pb-6" {...(tab === 'monthly' ? swipe : {})}>
      <header className="px-5 pb-2 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="홈으로"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{monthLabel}</p>
              <h1 className="mt-1 text-[2.05rem] leading-[1.05] font-semibold tracking-tight text-slate-950 dark:text-white">
                {reportsTitle}
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:bg-slate-100 hover:text-[#0d8a7a] dark:hover:bg-slate-800"
            aria-label={t('nav_settings')}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          {tab === 'monthly' && <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
        </div>
      </header>

      {/* Tab switcher */}
      <div className="mx-4 mt-2 mb-1 flex gap-1 rounded-[1.5rem] border border-slate-200/90 bg-white p-1 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <button
          onClick={() => setTab('monthly')}
          className={`tap-target flex-1 rounded-[1.1rem] py-2.5 text-sm font-semibold transition active:scale-95 ${tab === 'monthly' ? 'bg-[#0d8a7a] text-white shadow-lg shadow-[#0d8a7a]/20' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {t('analytics_tab_monthly')}
        </button>
        <button
          onClick={() => setTab('annual')}
          className={`tap-target flex-1 rounded-[1.1rem] py-2.5 text-sm font-semibold transition active:scale-95 ${tab === 'annual' ? 'bg-[#0d8a7a] text-white shadow-lg shadow-[#0d8a7a]/20' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {t('analytics_tab_annual')}
        </button>
      </div>

      <div className="mx-4 mt-2 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-rose-50 px-3 py-2.5 dark:bg-rose-900/20">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{expenseKey}</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(tab === 'annual' ? (annualData?.totalExpense ?? 0) : (currentSeries?.expense ?? 0), tab === 'annual' ? (annualData?.primaryCurrency ?? fallbackCurrency) : analyticsCurrency)}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-900/20">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{incomeKey}</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(tab === 'annual' ? (annualData?.totalIncome ?? 0) : (currentSeries?.income ?? 0), tab === 'annual' ? (annualData?.primaryCurrency ?? fallbackCurrency) : analyticsCurrency)}
          </p>
        </div>
      </div>

      {tab === 'annual' ? (
        <AnnualReport
          year={annualYear}
          onYearChange={setAnnualYear}
          data={annualData}
          isLoading={annualLoading}
          lang={lang}
          t={t}
          expenseKey={expenseKey}
          incomeKey={incomeKey}
        />
      ) : (
        <div className="space-y-4 px-4 py-4">
          {availableCurrencies.length > 1 && (
            <div className="card rounded-2xl p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {t('settings_currency_title')}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setSelectedCurrency(cur)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      cur === analyticsCurrency
                        ? 'bg-[#0d8a7a] text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{t('analytics_annual_currency_note')}</p>
            </div>
          )}

          {/* 전월 대비 배너 */}
          {!isLoading && expenseDiff !== null && (
            <div className={`flex items-center gap-3 rounded-3xl border border-white/70 px-4 py-4 shadow-sm backdrop-blur-xl ${
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
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 카테고리 파이 차트 */}
          {!isLoading && categoryBreakdown.length > 0 && (
            <div className="card rounded-3xl p-4">
              <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('analytics_category')}</h2>
              <div className="flex gap-4 items-center">
                <div className="shrink-0">
                  <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="amount"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={52}
                        strokeWidth={2}
                        stroke="transparent"
                        animationDuration={350}
                      >
                        {categoryBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {categoryBreakdown.map((cat, i) => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {i < 3 && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                            >
                              TOP{i + 1}
                            </span>
                          )}
                          <span className="truncate text-xs text-slate-600 dark:text-slate-400">{cat.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0 ml-2">
                          {formatCurrency(cat.amount, analyticsCurrency)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 월별 지출 추이 바 차트 */}
          <div className="card rounded-3xl p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('analytics_trend')}</h2>
            {isLoading ? (
              <CardSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <ResponsiveContainer width="100%" height={200} minWidth={300}>
                  <BarChart
                    data={monthlySeries.map((m) => ({
                      name: getMonthShortLabel(m.month, lang),
                      [expenseKey]: m.expense,
                      [incomeKey]: m.income,
                    }))}
                    barCategoryGap="30%"
                    barGap={3}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickFormatter={(v) => formatCompactAmount(v as number, analyticsCurrency)}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      formatter={(v) => formatCurrency(v as number, analyticsCurrency)}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid rgb(226 232 240 / 0.9)',
                        fontSize: '12px',
                        boxShadow: '0 20px 45px -20px rgb(15 23 42 / 0.2)',
                      }}
                    />
                    <Bar dataKey={expenseKey} fill="#bf5a5a" radius={[4, 4, 0, 0]} animationDuration={350} />
                    <Bar dataKey={incomeKey} fill="#2f8f5a" radius={[4, 4, 0, 0]} animationDuration={350} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {!isLoading && (
              <div className="mt-3 flex items-center gap-4 justify-center">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#bf5a5a]" />{expenseKey}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2f8f5a]" />{incomeKey}
                </span>
              </div>
            )}
          </div>
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
  data: { months: AnnualMonth[]; totalExpense: number; totalIncome: number; primaryCurrency: string } | undefined
  isLoading: boolean
  lang: string
  t: (key: TranslationKey) => string
  expenseKey: string
  incomeKey: string
}) {
  const net = (data?.totalIncome ?? 0) - (data?.totalExpense ?? 0)
  const currency = data?.primaryCurrency ?? 'CAD'

  return (
    <div className="p-4 space-y-4">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onYearChange(year - 1)}
          className="tap-target flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums w-16 text-center">{year}</span>
        <button
          onClick={() => onYearChange(year + 1)}
          disabled={year >= new Date().getFullYear()}
          className="tap-target flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-30"
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
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('analytics_annual_trend')}</h2>
          <span className="text-[10px] text-slate-400">{t('analytics_annual_currency_note')} · {currency}</span>
        </div>
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={200} minWidth={340}>
              <BarChart
                data={data?.months.map((m) => ({
                  name: getMonthShortLabel(m.month, lang),
                  [expenseKey]: m.expense,
                  [incomeKey]: m.income,
                }))}
                barCategoryGap="25%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => formatCompactAmount(v as number, currency)}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v as number, currency)}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                  }}
                />
                <Bar dataKey={expenseKey} fill="#bf5a5a" radius={[3, 3, 0, 0]} animationDuration={350} />
                <Bar dataKey={incomeKey} fill="#2f8f5a" radius={[3, 3, 0, 0]} animationDuration={350} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {!isLoading && (
          <div className="mt-3 flex items-center gap-4 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#bf5a5a]" />{expenseKey}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2f8f5a]" />{incomeKey}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
