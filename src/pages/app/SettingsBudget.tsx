import { useMemo, useState } from 'react'
import { ChevronLeft, Target, Check, Settings, WalletCards, PencilLine, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCategories } from '@/lib/hooks/useCategories'
import { useBudgetGoals } from '@/lib/hooks/useBudgetGoals'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useMonthlyBudget } from '@/lib/hooks/useMonthlyBudget'
import { useCurrentMonthOnEntry } from '@/lib/hooks/useCurrentMonthOnEntry'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'
import { convertAmountOrZero, parseAmountInput } from '@/lib/utils/currency'
import { calculateBudgetProgress, calculateTransactionTotals, convertBudgetLimit } from '@/lib/utils/finance'
import { formatCurrency } from '@/utils/format'
import { useT } from '@/lib/hooks/useT'
import { Card } from '@/components/ui/Card'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export default function SettingsBudget() {
  const navigate = useNavigate()
  const t = useT()
  const { data: categories, isLoading } = useCategories()
  const { currency: defaultCurrency, selectedMonth, lang } = useUIStore()
  const setSelectedMonth = useUIStore((state) => state.setSelectedMonth)
  useCurrentMonthOnEntry(setSelectedMonth)
  const { goals, setGoal, setAllCurrencies } = useBudgetGoals(selectedMonth)
  const { data: dashData } = useDashboard(selectedMonth)
  const { budget: monthlyBudget, setBudget: setMonthlyBudget } = useMonthlyBudget(selectedMonth)
  const { data: ratesData } = useExchangeRates(defaultCurrency)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [isMonthlyEditorOpen, setIsMonthlyEditorOpen] = useState(false)
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [monthlyCurrency, setMonthlyCurrency] = useState<CurrencyCode>(defaultCurrency)
  const [budgetInputMode, setBudgetInputMode] = useState<'percent' | 'amount'>('percent')

  const primaryCurrency = defaultCurrency as CurrencyCode

  function openEdit(categoryId: string) {
    const existing = goals[categoryId]
    if (budgetInputMode === 'percent') {
      if (existing?.type === 'percent' && existing.percent !== null) {
        setEditAmount(String(existing.percent))
      } else if (existing && monthlyBudget?.amount) {
        const pct = Math.round((existing.amount / monthlyBudget.amount) * 1000) / 10
        setEditAmount(String(pct))
      } else {
        setEditAmount('')
      }
    } else {
      setEditAmount(existing ? String(existing.amount) : '')
    }
    setEditingId(categoryId)
  }

  function toggleEdit(categoryId: string) {
    if (editingId === categoryId) {
      setEditingId(null)
      setEditAmount('')
      return
    }
    openEdit(categoryId)
  }

  async function saveEdit(categoryId: string) {
    const amount = parseAmountInput(editAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    if (budgetInputMode === 'percent') {
      if (!monthlyBudget || monthlyBudget.amount <= 0) {
        toast.error('월 전체 예산을 먼저 설정해주세요')
        return
      }
      if (amount > 100) {
        toast.error('비율은 100%를 넘을 수 없습니다')
        return
      }
      const otherTotal = Object.entries(goals)
        .filter(([id]) => id !== categoryId)
        .reduce((sum, [, goal]) => sum + (goal.type === 'percent' ? (goal.percent ?? 0) : 0), 0)
      if (otherTotal + amount > 100) {
        toast.error('전체 비율이 100%를 넘을 수 없습니다')
        return
      }
      const computedAmount = (monthlyBudget.amount * amount) / 100
      await setGoal(categoryId, {
        amount: computedAmount,
        currency: monthlyBudget.currency,
        percent: amount,
        type: 'percent',
      })
      toast.success(t('budget_saved'))
      setEditingId(null)
      setEditAmount('')
      return
    }
    const targetCurrency = monthlyBudget?.currency ?? primaryCurrency
    await setAllCurrencies(targetCurrency)
    await setGoal(categoryId, { amount, currency: targetCurrency, percent: null, type: 'amount' })
    toast.success(t('budget_saved'))
    setEditingId(null)
    setEditAmount('')
  }

  function deleteGoal(categoryId: string) {
    setGoal(categoryId, null)
    toast.success(t('budget_deleted'))
    setEditingId(null)
    setEditAmount('')
  }

  async function saveMonthlyBudget() {
    const amount = parseAmountInput(monthlyAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    if (budgetInputMode === 'amount') {
      await setAllCurrencies(monthlyCurrency)
    }
    await setMonthlyBudget({ amount, currency: monthlyCurrency })
    toast.success(t('monthly_budget_saved'))
    setIsMonthlyEditorOpen(false)
  }

  function clearMonthlyBudget() {
    setMonthlyBudget(null)
    setMonthlyAmount('')
    setMonthlyCurrency(primaryCurrency)
    toast.success(t('monthly_budget_deleted'))
    setIsMonthlyEditorOpen(false)
  }

  function openMonthlyEditor() {
    setMonthlyAmount(monthlyBudget?.amount ? String(monthlyBudget.amount) : '')
    if (!monthlyBudget) {
      setMonthlyCurrency(primaryCurrency)
      setIsMonthlyEditorOpen(true)
      return
    }
    setMonthlyCurrency(monthlyBudget.currency)
    setIsMonthlyEditorOpen(true)
  }

  const expenseTransactions = useMemo(() => {
    return (dashData?.transactions ?? []).filter((tx) => tx.type === '지출')
  }, [dashData?.transactions])

  const toPrimary = (amount: number, currency: string) => {
    return convertAmountOrZero(amount, currency, primaryCurrency, ratesData?.rates, ratesData?.base)
  }

  const totalExpensePrimary = calculateTransactionTotals(expenseTransactions, primaryCurrency, ratesData?.rates, ratesData?.base).expense

  const displayCurrency = monthlyBudget ? monthlyBudget.currency : primaryCurrency

  const monthlyBudgetAmountDisplay = monthlyBudget
    ? convertBudgetLimit(monthlyBudget.amount, monthlyBudget.currency, displayCurrency, ratesData?.rates, ratesData?.base)
    : 0

  const totalSpentDisplay = displayCurrency === primaryCurrency
    ? totalExpensePrimary
    : convertAmountOrZero(totalExpensePrimary, primaryCurrency, displayCurrency, ratesData?.rates, ratesData?.base)

  const monthlyProgress = calculateBudgetProgress(totalSpentDisplay, monthlyBudgetAmountDisplay)
  const remaining = monthlyProgress.remainingAmount
  const usedPct = monthlyProgress.usedPct
  const assignedPercent = Object.values(goals).reduce((sum, goal) => {
    return sum + (goal.type === 'percent' ? (goal.percent ?? 0) : 0)
  }, 0)
  const unassignedPercent = Math.max(100 - assignedPercent, 0)

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    expenseTransactions.forEach((tx) => {
      if (!tx.category_id) return
      const goal = goals[tx.category_id]
      if (!goal) return
      const goalCurrency = goal.type === 'percent'
        ? (monthlyBudget?.currency ?? primaryCurrency)
        : goal.currency
      const converted = convertAmountOrZero(tx.amount, tx.currency, goalCurrency, ratesData?.rates, ratesData?.base)
      const next = (map.get(tx.category_id) ?? 0) + converted
      map.set(tx.category_id, next)
    })
    return map
  }, [expenseTransactions, goals, monthlyBudget?.currency, primaryCurrency, ratesData?.base, ratesData?.rates])
  const monthLabel = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const date = new Date(y, m - 1, 1)
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  })()

  const firstSymbol = (text?: string | null) => {
    if (!text) return '?'
    const s = text.trim()
    if (!s) return '?'
    return Array.from(s)[0] ?? '?'
  }

  const getConvertedLabel = (amount: number, currency: string) => {
    if (currency === defaultCurrency) return null
    const converted = convertAmountOrZero(amount, currency, defaultCurrency, ratesData?.rates, ratesData?.base)
    if (converted === 0 && amount !== 0) return null
    return formatCurrency(converted, defaultCurrency)
  }

  async function applyAutoDistribution() {
    if (!monthlyBudget || monthlyBudget.amount <= 0) {
      toast.error(lang === 'ko' ? '월 전체 예산을 먼저 설정해주세요' : 'Set a monthly budget first')
      return
    }

    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, month - 6, 1)
    const endDate = new Date(year, month, 0)
    const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('transactions')
      .select('category_id, amount, currency')
      .eq('type', '지출')
      .gte('date', start)
      .lte('date', end)

    if (error) {
      toast.error(error.message)
      return
    }

    const totals = new Map<string, number>()
    ;(data ?? []).forEach((tx) => {
      if (!tx.category_id) return
      const converted = convertAmountOrZero(tx.amount, tx.currency ?? primaryCurrency, monthlyBudget.currency, ratesData?.rates, ratesData?.base)
      totals.set(tx.category_id, (totals.get(tx.category_id) ?? 0) + converted)
    })

    const totalSpent = Array.from(totals.values()).reduce((sum, amount) => sum + amount, 0)
    if (totalSpent <= 0) {
      toast.error(lang === 'ko' ? '최근 지출 데이터가 부족해요' : 'Not enough recent spending data')
      return
    }

    const categoryIds = new Set(categories?.map((cat) => cat.id) ?? [])
    const entries = Array.from(totals.entries())
      .filter(([categoryId]) => categoryIds.has(categoryId))
      .sort((a, b) => b[1] - a[1])

    let assignedPercent = 0
    for (let index = 0; index < entries.length; index += 1) {
      const [categoryId, amount] = entries[index]
      const percent = index === entries.length - 1
        ? Math.max(0, Math.round((100 - assignedPercent) * 10) / 10)
        : Math.max(0.1, Math.round((amount / totalSpent) * 1000) / 10)
      assignedPercent += percent
      await setGoal(categoryId, {
        amount: (monthlyBudget.amount * percent) / 100,
        currency: monthlyBudget.currency,
        percent,
        type: 'percent',
      })
    }

    toast.success(lang === 'ko' ? '최근 지출 비중으로 예산을 배분했어요' : 'Budget distributed from recent spending')
  }

  return (
    <div className="min-h-full pb-6">
      {/* Header */}
      <header className="fintra-page-header">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="fintra-icon-button mt-0.5 h-10 w-10 rounded-2xl shadow-[var(--fintra-shadow-soft)] dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="fintra-kicker">{monthLabel}</p>
              <h1 className="fintra-page-title mt-1 dark:text-white">{t('budget_title')}</h1>
              <p className="mt-2 max-w-[18rem] text-sm font-medium leading-6 text-[var(--fintra-ink-2)]">
                {lang === 'ko' ? '월 예산과 카테고리 한도를 차분하게 관리하세요.' : 'Set monthly limits and keep each category in rhythm.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="fintra-icon-button h-10 w-10 rounded-2xl hover:text-[#0b6f61] dark:hover:bg-slate-800"
            aria-label={t('nav_settings')}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="fintra-screen fintra-stack pt-2">
        <div className="fintra-horizontal-scroll -mx-1 px-1 pb-1">
          <div className="flex w-max min-w-full items-center gap-2">
          <button
            onClick={() => navigate('/settings/categories?new=1')}
            className="shrink-0 rounded-full bg-[#dceee9] px-3.5 py-2 text-[12px] font-bold text-[#0b6f61] transition active:scale-95"
          >
            카테고리 추가
          </button>
          <button
            onClick={() => navigate('/settings/categories')}
            className="shrink-0 rounded-full border border-white/80 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-600 shadow-[var(--fintra-shadow-soft)] transition active:scale-95"
          >
            카테고리 수정
          </button>
          </div>
        </div>

        <Card variant="soft" padding="sm" className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">입력 방식</span>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[#edf1ef] p-1">
            <button
              type="button"
              onClick={() => setBudgetInputMode('percent')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                budgetInputMode === 'percent'
                  ? 'bg-white text-[#0b6f61] shadow-[var(--fintra-shadow-soft)]'
                  : 'text-slate-500'
              }`}
            >
              퍼센트
            </button>
            <button
              type="button"
              onClick={() => setBudgetInputMode('amount')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                budgetInputMode === 'amount'
                  ? 'bg-white text-[#0b6f61] shadow-[var(--fintra-shadow-soft)]'
                  : 'text-slate-500'
              }`}
            >
              금액
            </button>
          </div>
        </Card>

        <button
          type="button"
          onClick={applyAutoDistribution}
          className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[#dceee9] bg-white px-4 py-3 text-sm font-bold text-[#0b6f61] shadow-[var(--fintra-shadow-soft)] transition active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900"
        >
          <Sparkles className="h-4 w-4" />
          {lang === 'ko' ? '최근 6개월 기준 자동 배분' : 'Auto-distribute from 6 months'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (isMonthlyEditorOpen) {
              setIsMonthlyEditorOpen(false)
              return
            }
            openMonthlyEditor()
          }}
          className="relative w-full overflow-hidden rounded-[2.25rem] border border-white/50 bg-[linear-gradient(145deg,#005247_0%,#006b5b_58%,#0a7768_100%)] px-5 py-5 text-left text-white shadow-[0_24px_54px_rgba(11,111,97,0.2)] transition active:scale-[0.992]"
        >
          <div className="pointer-events-none absolute right-[-2rem] top-[-2rem] h-32 w-32 rounded-full bg-white/10" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/62">{lang === 'ko' ? '총 월 예산' : 'Total monthly budget'}</p>
              <p className="mt-2 text-[clamp(2rem,7vw,3rem)] font-semibold leading-none tabular-nums">{formatCurrency(totalSpentDisplay, displayCurrency)}</p>
              <p className="mt-2 text-xs font-semibold text-white/62">
                {lang === 'ko' ? '이번 달 사용 금액' : 'spent this month'}
              </p>
            </div>
            <div className="pt-1 text-right">
              <span className="ml-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/12">
                <WalletCards className="h-4 w-4" />
              </span>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">{lang === 'ko' ? '한도' : 'Limit'}</p>
              <p className="mt-1 text-[1.04rem] font-semibold tracking-tight text-white tabular-nums">
                {monthlyBudgetAmountDisplay > 0
                  ? formatCurrency(monthlyBudgetAmountDisplay, displayCurrency)
                  : t('monthly_budget_no_limit')}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-[1.25rem] bg-white/10 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/58">{lang === 'ko' ? '사용률' : 'Usage'}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{usedPct}%</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/10 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/58">{lang === 'ko' ? '남은 예산' : 'Remaining'}</p>
              <p className="mt-1 break-words text-xl font-semibold leading-tight tabular-nums text-white [overflow-wrap:anywhere]">
                {monthlyBudgetAmountDisplay > 0 ? formatCurrency(remaining, displayCurrency) : '-'}
              </p>
              {monthlyBudgetAmountDisplay > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-white/64">
                  {lang === 'ko' ? `${monthlyProgress.remainingPct}% 남음` : `${monthlyProgress.remainingPct}% left`}
                </p>
              )}
            </div>
          </div>
          {budgetInputMode === 'percent' && monthlyBudgetAmountDisplay > 0 && (
            <div className="mt-2 rounded-[1.25rem] bg-white/10 px-3 py-3">
              <div className="flex items-center justify-between gap-3 text-[11px] font-semibold">
                <span className="text-white/60">{lang === 'ko' ? '카테고리 배정' : 'Category assigned'}</span>
                <span className="text-white">{Math.min(assignedPercent, 100)}% / 100%</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-white/70">
                {lang === 'ko'
                  ? `${unassignedPercent}% (${formatCurrency((monthlyBudgetAmountDisplay * unassignedPercent) / 100, displayCurrency)}) 남음`
                  : `${unassignedPercent}% (${formatCurrency((monthlyBudgetAmountDisplay * unassignedPercent) / 100, displayCurrency)}) left`}
              </p>
            </div>
          )}
          <div className="mt-6 rounded-[1.45rem] bg-white/10 p-3.5">
            <div className="h-2.5 overflow-hidden rounded-full bg-white/18">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.min(usedPct, 100)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <p className="font-semibold text-white/68">{t('monthly_budget_used')(usedPct)}</p>
              <p className="font-semibold text-white">
              {monthlyBudgetAmountDisplay > 0
                ? t('monthly_budget_remaining')(formatCurrency(remaining, displayCurrency))
                : t('monthly_budget_no_limit')}
              </p>
            </div>
          </div>
        </button>

        {isMonthlyEditorOpen && (
          <Card variant="settings" padding="md" className="border-[#dceee9]">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('monthly_budget_title')}</h2>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{t('monthly_budget_desc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthlyEditorOpen(false)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('budget_cancel')}
              </button>
            </div>
            <div className="space-y-2.5">
              <CurrencyInput
                currency={monthlyCurrency}
                placeholder="0"
                value={monthlyAmount}
                onChange={(value) => setMonthlyAmount(value === '' ? '' : String(value))}
                className="rounded-[1.15rem] py-3 pl-20 text-base shadow-none"
              />
              <div className="fintra-horizontal-scroll flex gap-1.5 pb-1">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setMonthlyCurrency(c.code)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                      monthlyCurrency === c.code
                        ? 'border-[#0b6f61] bg-[#dceee9] text-[#0b6f61]'
                        : 'border-slate-200 text-slate-500 dark:border-slate-700'
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearMonthlyBudget}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {t('budget_delete')}
                </button>
                <button
                  onClick={saveMonthlyBudget}
                  className="flex-1 rounded-xl bg-[#0b6f61] py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#063f39]"
                >
                  {t('monthly_budget_set')}
                </button>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categories?.map((cat) => {
              const goal = goals[cat.id]
              const isEditing = editingId === cat.id
              const spent = spentByCategory.get(cat.id) ?? 0
              const goalCurrency = goal?.type === 'percent'
                ? (monthlyBudget?.currency ?? primaryCurrency)
                : (goal?.currency ?? primaryCurrency)
              const goalAmount = goal
                ? (goal.type === 'percent'
                  ? ((monthlyBudget?.amount ?? 0) * (goal.percent ?? 0)) / 100
                  : goal.amount)
                : 0
              const progress = calculateBudgetProgress(spent, goalAmount)
              const pct = progress.usedPct
              const left = progress.remainingAmount
              const barColor = cat.color || '#0d8a7a'

              return (
                <Card
                  key={cat.id}
                  onClick={() => toggleEdit(cat.id)}
                  variant="budget"
                  padding="md"
                  className={`${
                    !isEditing ? 'cursor-pointer transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40' : ''
                  }`}
                >
                  {/* Category row */}
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] text-sm font-bold"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {(() => {
                        const rawIcon = cat.icon?.trim() ?? ''
                        return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : firstSymbol(cat.name)
                      })()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[0.98rem] font-semibold text-[var(--fintra-charcoal)] dark:text-white">
                            {cat.name}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">
                            {goal
                              ? `${pct}% ${lang === 'ko' ? '사용' : 'used'} · ${progress.remainingPct}% ${lang === 'ko' ? '남음' : 'left'}`
                              : t('budget_no_limit')}
                          </p>
                        </div>
                        {goal && !isEditing && (
                          <div className="shrink-0 max-w-[54%] pl-2 text-right text-[0.8rem] font-semibold tabular-nums leading-tight">
                            <span className="block break-all text-[var(--fintra-charcoal)]">
                              {goalAmount > 0 && goalCurrency
                                ? `${formatCurrency(spent, goalCurrency)} / ${formatCurrency(goalAmount, goalCurrency)}`
                                : t('monthly_budget_no_limit')}
                            </span>
                            {goal?.type === 'percent' && (
                              <span className="mt-0.5 block break-all text-[0.75rem] text-slate-400">
                                {goal.percent ?? 0}% {lang === 'ko' ? '배정' : 'assigned'}
                              </span>
                            )}
                            <span className="mt-1 block break-all text-[0.75rem] text-[#0b6f61]">
                              {goalAmount > 0 && goalCurrency
                                ? `${formatCurrency(left, goalCurrency)} ${lang === 'ko' ? '남음' : 'left'}`
                                : t('monthly_budget_no_limit')}
                            </span>
                            {goal?.type === 'amount' && getConvertedLabel(spent, goal.currency) && getConvertedLabel(goal.amount, goal.currency) && (
                              <span className="mt-0.5 block break-all text-[0.7rem] text-slate-400">
                                {getConvertedLabel(spent, goal.currency)} / {getConvertedLabel(goal.amount, goal.currency)}
                              </span>
                            )}
                            {goal?.type === 'amount' && getConvertedLabel(left, goal.currency) && (
                              <span className="mt-0.5 block break-all text-[0.7rem] text-slate-400">
                                {getConvertedLabel(left, goal.currency)} {lang === 'ko' ? '남음' : 'left'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {goal && !isEditing && (
                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
                            <span className="text-[#8b9390]">{lang === 'ko' ? '진행률' : 'Progress'}</span>
                            <span style={{ color: pct >= 90 ? '#c46f63' : pct >= 70 ? '#d89455' : '#006b5b' }}>
                              {pct}% {lang === 'ko' ? '사용' : 'used'} · {progress.remainingPct}% {lang === 'ko' ? '남음' : 'left'}
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-[#edf1ef]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: pct >= 90 ? '#ec8b83' : pct >= 70 ? '#d89455' : (barColor || '#006b5b'),
                              }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                            <span>{formatCurrency(spent, goalCurrency)}</span>
                            <span>{formatCurrency(goalAmount, goalCurrency)}</span>
                          </div>
                        </div>
                      )}

                      {!goal && !isEditing && (
                        <p className="mt-1 text-[10px] text-slate-400">{t('budget_no_limit')}</p>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                      <div className="mt-4 space-y-3 rounded-[1.35rem] bg-[#f7f6f3] p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                        <div className="mb-2 flex items-center gap-2">
                          <PencilLine className="h-4 w-4 text-[#006b5b]" />
                          <p className="text-xs font-bold text-[#5f6868]">
                            {budgetInputMode === 'percent' ? (lang === 'ko' ? '비율 한도 수정' : 'Edit percentage limit') : (lang === 'ko' ? '금액 한도 수정' : 'Edit amount limit')}
                          </p>
                        </div>
                        {budgetInputMode === 'percent' ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value.replace(/[^\d.]/g, ''))}
                            autoFocus
                            className="w-full rounded-[1.15rem] border border-transparent bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:ring-4 focus:ring-[#0b6f61]/10 dark:bg-slate-800 dark:text-white"
                          />
                        ) : (
                          <CurrencyInput
                            currency={goalCurrency}
                            placeholder="0"
                            value={editAmount}
                            onChange={(value) => setEditAmount(value === '' ? '' : String(value))}
                            autoFocus
                            className="rounded-[1.15rem] py-3 pl-20 text-base shadow-none"
                          />
                        )}
                        {budgetInputMode === 'percent' && (
                          <p className="mt-1 text-[10px] text-slate-400">월 예산 기준 비율(%)</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteGoal(cat.id)}
                          className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20"
                        >
                          {t('budget_delete')}
                        </button>
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="flex-1 rounded-xl bg-[#0b6f61] py-2.5 text-xs font-semibold text-white transition hover:bg-[#063f39] flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('budget_save')}
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-2.5 rounded-xl bg-[#dbefeb] px-3.5 py-3">
          <Target className="h-4 w-4 text-[#0d8a7a] shrink-0 mt-0.5" />
          <p className="text-xs text-[#0d8a7a] leading-relaxed">
            {t('budget_note')}
          </p>
        </div>
      </div>
    </div>
  )
}
