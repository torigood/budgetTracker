import { useState } from 'react'
import { ChevronLeft, Target, Pencil, X, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCategories } from '@/lib/hooks/useCategories'
import { useBudgetGoals } from '@/lib/hooks/useBudgetGoals'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { formatCurrency } from '@/utils/format'
import { useT } from '@/lib/hooks/useT'
import type { CurrencyCode } from '@/lib/stores/ui.store'

export default function SettingsBudget() {
  const navigate = useNavigate()
  const t = useT()
  const { data: categories, isLoading } = useCategories()
  const { goals, setGoal } = useBudgetGoals()
  const { currency: defaultCurrency } = useUIStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>(defaultCurrency)

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

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => navigate('/settings')}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs text-slate-400">{t('settings_title')}</p>
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{t('budget_title')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {/* Description */}
        <p className="text-xs text-slate-400 px-1">{t('budget_desc')}</p>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {categories?.map((cat) => {
              const goal = goals[cat.id]
              const isEditing = editingId === cat.id

              return (
                <div key={cat.id} className="px-4 py-3.5">
                  {/* Category row */}
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{cat.name}</p>
                      {goal && !isEditing && (
                        <p className="text-xs text-indigo-500 font-semibold mt-0.5">
                          {formatCurrency(goal.amount, goal.currency)} / 월
                        </p>
                      )}
                      {!goal && !isEditing && (
                        <p className="text-xs text-slate-400 mt-0.5">{t('budget_no_limit')}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        {goal && (
                          <button
                            onClick={() => deleteGoal(cat.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(cat.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="mt-3 space-y-2.5">
                      {/* Amount input */}
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          autoFocus
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-base text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                        />
                      </div>

                      {/* Currency selector */}
                      <div className="flex gap-1.5 flex-wrap">
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => setEditCurrency(c.code)}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                              editCurrency === c.code
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                          >
                            {c.code}
                          </button>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEdit}
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {t('budget_cancel')}
                        </button>
                        <button
                          onClick={() => saveEdit(cat.id)}
                          className="flex-1 rounded-xl bg-indigo-500 py-2 text-xs font-semibold text-white transition hover:bg-indigo-600 flex items-center justify-center gap-1.5"
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
        <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 px-3.5 py-3">
          <Target className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
            예산을 설정하면 해당 카테고리 지출이 80%에 달할 때 알림을 받을 수 있어요. 알림은 설정 {'>'} 알림에서 켤 수 있어요.
          </p>
        </div>
      </div>
    </div>
  )
}
