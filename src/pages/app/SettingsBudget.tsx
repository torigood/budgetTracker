import { useState } from 'react'
import { ChevronLeft, Target, Check, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCategories } from '@/lib/hooks/useCategories'
import { useBudgetGoals } from '@/lib/hooks/useBudgetGoals'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useMonthlyBudget } from '@/lib/hooks/useMonthlyBudget'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { formatCurrency } from '@/utils/format'
import { useT } from '@/lib/hooks/useT'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export default function SettingsBudget() {
  const navigate = useNavigate()
  const t = useT()
  const { data: categories, isLoading } = useCategories()
  const { goals, setGoal } = useBudgetGoals()
  const { currency: defaultCurrency, selectedMonth, lang } = useUIStore()
  const { data: dashData } = useDashboard(selectedMonth)
  const { budget: monthlyBudget, setBudget: setMonthlyBudget } = useMonthlyBudget()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>(defaultCurrency)
  const [isMonthlyEditorOpen, setIsMonthlyEditorOpen] = useState(false)
  const [monthlyAmount, setMonthlyAmount] = useState(() =>
    monthlyBudget?.amount ? String(monthlyBudget.amount) : ''
  )
  const [monthlyCurrency, setMonthlyCurrency] = useState<CurrencyCode>(
    monthlyBudget?.currency ?? defaultCurrency
  )

  function openEdit(categoryId: string) {
    const existing = goals[categoryId]
    setEditAmount(existing ? String(existing.amount) : '')
    setEditCurrency(existing?.currency ?? defaultCurrency)
    setEditingId(categoryId)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditAmount('')
  }

  function saveEdit(categoryId: string) {
    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    setGoal(categoryId, { amount, currency: editCurrency })
    toast.success(t('budget_saved'))
    setEditingId(null)
    setEditAmount('')
  }

  function deleteGoal(categoryId: string) {
    setGoal(categoryId, null)
    toast.success(t('budget_deleted'))
  }

  function saveMonthlyBudget() {
    const amount = parseFloat(monthlyAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }
    setMonthlyBudget({ amount, currency: monthlyCurrency })
    toast.success(t('monthly_budget_saved'))
    setIsMonthlyEditorOpen(false)
  }

  function clearMonthlyBudget() {
    setMonthlyBudget(null)
    setMonthlyAmount('')
    setMonthlyCurrency(defaultCurrency)
    toast.success(t('monthly_budget_deleted'))
    setIsMonthlyEditorOpen(false)
  }

  function openMonthlyEditor() {
    setMonthlyAmount(monthlyBudget?.amount ? String(monthlyBudget.amount) : '')
    setMonthlyCurrency(monthlyBudget?.currency ?? defaultCurrency)
    setIsMonthlyEditorOpen(true)
  }

  const spentByCategory = new Map((dashData?.categoryBreakdown ?? []).map((c) => [c.id, c.amount]))
  const goalEntries = categories?.filter((cat) => goals[cat.id]) ?? []
  const totalBudget = goalEntries.reduce((sum, cat) => sum + (goals[cat.id]?.amount ?? 0), 0)
  const totalSpent = goalEntries.reduce((sum, cat) => sum + (spentByCategory.get(cat.id) ?? 0), 0)
  const remaining = Math.max(totalBudget - totalSpent, 0)
  const usedPct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0
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

  return (
    <div className="min-h-full pb-6">
      {/* Header */}
      <header className="mx-4 flex items-center gap-3 px-1 py-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">{monthLabel}</p>
          <h1 className="text-[1.38rem] leading-[1.12] font-semibold tracking-tight text-slate-900 dark:text-white">{t('budget_title')}</h1>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:bg-slate-100 hover:text-[#0d8a7a] dark:hover:bg-slate-800"
          aria-label={t('nav_settings')}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <div className="space-y-2.5 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/settings/categories?new=1')}
            className="rounded-full bg-[#dbefeb] px-3 py-1.5 text-[12px] font-semibold text-[#0d8a7a] transition hover:bg-[#cde8e2]"
          >
            카테고리 추가
          </button>
          <button
            onClick={() => navigate('/settings/categories')}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            카테고리 수정
          </button>
        </div>

        <div className="card rounded-[1.2rem] border border-slate-200/75 bg-white px-3 py-3 shadow-sm dark:border-slate-800/80">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{t('monthly_budget_title')}</h2>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{t('monthly_budget_desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isMonthlyEditorOpen) {
                  setIsMonthlyEditorOpen(false)
                  return
                }
                openMonthlyEditor()
              }}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {isMonthlyEditorOpen ? t('budget_cancel') : monthlyBudget ? t('tx_edit') : t('monthly_budget_set')}
            </button>
          </div>

          {!isMonthlyEditorOpen ? (
            <button
              type="button"
              onClick={openMonthlyEditor}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {t('monthly_budget_title')}
              </p>
              <p className="mt-1 text-[0.9rem] font-semibold text-slate-900 tabular-nums dark:text-white">
                {monthlyBudget
                  ? formatCurrency(monthlyBudget.amount, monthlyBudget.currency)
                  : t('monthly_budget_no_limit')}
              </p>
            </button>
          ) : (
            <div className="space-y-2.5">
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0d8a7a] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setMonthlyCurrency(c.code)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                      monthlyCurrency === c.code
                        ? 'border-[#0d8a7a] bg-[#dbefeb] text-[#0d8a7a]'
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
                  className="flex-1 rounded-xl border border-slate-200 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {t('budget_delete')}
                </button>
                <button
                  onClick={saveMonthlyBudget}
                  className="flex-1 rounded-xl bg-[#0d8a7a] py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0a7568]"
                >
                  {t('monthly_budget_set')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[1.3rem] border border-[#8de0d4]/80 bg-[#c4ece5] px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0d8a7a]">{lang === 'ko' ? '이번 달 사용' : 'Spent this month'}</p>
              <p className="mt-1 text-[1.4rem] font-semibold tracking-tight text-slate-950 tabular-nums">{formatCurrency(totalSpent, defaultCurrency)}</p>
            </div>
            <div className="pt-1 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">{lang === 'ko' ? '예산' : 'Budget'}</p>
              <p className="mt-1 text-[1.04rem] font-semibold tracking-tight text-[#0d8a7a] tabular-nums">{formatCurrency(totalBudget, defaultCurrency)}</p>
            </div>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/65">
            <div className="h-full rounded-full bg-[#0d8a7a]" style={{ width: `${usedPct}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{usedPct}% {lang === 'ko' ? '사용' : 'used'}</span>
            <span className="font-semibold text-[#1f8d56] tabular-nums">{formatCurrency(remaining, defaultCurrency)} {lang === 'ko' ? '남음' : 'remaining'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {categories?.map((cat) => {
              const goal = goals[cat.id]
              const isEditing = editingId === cat.id
              const spent = spentByCategory.get(cat.id) ?? 0
              const pct = goal ? Math.min(Math.round((spent / goal.amount) * 100), 100) : 0
              const left = goal ? Math.max(goal.amount - spent, 0) : 0
              const barColor = cat.color || '#0d8a7a'

              return (
                <div
                  key={cat.id}
                  onClick={!isEditing ? () => openEdit(cat.id) : undefined}
                  className={`card rounded-[1.45rem] border border-slate-200/90 bg-white px-3.5 py-3.5 shadow-sm dark:border-slate-800 ${
                    !isEditing ? 'cursor-pointer transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40' : ''
                  }`}
                >
                  {/* Category row */}
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {(() => {
                        const rawIcon = cat.icon?.trim() ?? ''
                        return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : firstSymbol(cat.name)
                      })()}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[0.9rem] font-semibold text-slate-900 dark:text-white">
                          {cat.name}
                        </p>
                        {goal && !isEditing && (
                          <div className="shrink-0 flex items-center gap-2 pl-2 text-[0.86rem] font-semibold tabular-nums">
                            <span className="text-slate-500">
                              {formatCurrency(spent, goal.currency)} / {formatCurrency(goal.amount, goal.currency)}
                            </span>
                            <span className="text-slate-400">
                              {formatCurrency(left, goal.currency)} {lang === 'ko' ? '남음' : 'left'}
                            </span>
                          </div>
                        )}
                      </div>

                      {goal && !isEditing && (
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#dfe4ea]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: barColor,
                              boxShadow: `0 1px 2px ${barColor}44`,
                            }}
                          />
                        </div>
                      )}

                      {!goal && !isEditing && (
                        <p className="mt-1 text-[10px] text-slate-400">{t('budget_no_limit')}</p>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="mt-3 space-y-2.5">
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          autoFocus
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-base text-slate-900 dark:text-white outline-none focus:border-[#0d8a7a] transition"
                        />
                      </div>

                      <div className="flex gap-1.5 flex-wrap">
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => setEditCurrency(c.code)}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                              editCurrency === c.code
                                ? 'border-[#0d8a7a] bg-[#dbefeb] text-[#0d8a7a]'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            {c.code}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {goals[cat.id] && (
                          <button
                            onClick={() => deleteGoal(cat.id)}
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20"
                          >
                            {t('budget_delete')}
                          </button>
                        )}
                        <button
                          onClick={cancelEdit}
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {t('budget_cancel')}
                        </button>
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="flex-1 rounded-xl bg-[#0d8a7a] py-2 text-xs font-semibold text-white transition hover:bg-[#0a7568] flex items-center justify-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('budget_save')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
