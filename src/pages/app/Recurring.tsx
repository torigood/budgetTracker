import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Power, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRecurringItems, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, type RecurringWithCategory } from '@/lib/hooks/useRecurring'
import { useCategories } from '@/lib/hooks/useCategories'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { translations } from '@/lib/i18n'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryBadge } from '@/components/ui/Badge'
import { PAYMENT_METHODS } from '@/types/app'
import { formatCurrency } from '@/utils/format'
import { useT } from '@/lib/hooks/useT'
import type { RecurringItem } from '@/types/app'

function createSchema() {
  return z.object({
    category_id: z.string().min(1, 'Please select a category'),
    description: z.string().min(1, 'Please enter a description'),
    amount: z.coerce.number().positive('Please enter an amount'),
    currency: z.string().min(1),
    payment_method: z.string().min(1),
    day_of_month: z.coerce.number().int().min(1).max(31),
  })
}

const schema = createSchema()
type FormValues = z.infer<typeof schema>

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'

export default function Recurring() {
  const t = useT()
  const { data: items, isLoading, isFetching, refetch } = useRecurringItems()
  const { data: categories } = useCategories()
  const { currency: defaultCurrency, lang } = useUIStore()
  const tr = translations[lang]
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const deleteMutation = useDeleteRecurring()

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<RecurringItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [todayKey, setTodayKey] = useState(() => new Date().toISOString().slice(0, 10))
  const recurringItems = items as RecurringWithCategory[] | undefined

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { payment_method: '자동지출', day_of_month: 1 },
  })

  const currentDay = useMemo(() => Number(todayKey.slice(8, 10)), [todayKey])
  const totalMonthly = recurringItems
    ?.filter((i) => i.is_active && i.day_of_month <= currentDay)
    .reduce((sum, i) => sum + i.amount, 0) ?? 0

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextKey = new Date().toISOString().slice(0, 10)
      setTodayKey((prev) => (prev === nextKey ? prev : nextKey))
    }, 60_000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setTodayKey(new Date().toISOString().slice(0, 10))
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  function openCreate() {
    setEditItem(null)
    reset({ payment_method: '자동지출', day_of_month: 1, currency: defaultCurrency })
    setShowForm(true)
  }

  function openEdit(item: RecurringItem) {
    setEditItem(item)
    reset({
      category_id: item.category_id,
      description: item.description,
      amount: item.amount,
      currency: item.currency ?? defaultCurrency,
      payment_method: item.payment_method,
      day_of_month: item.day_of_month,
    })
    setShowForm(true)
  }

  async function onSubmit(values: FormValues) {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, data: values })
        toast.success(t('recurring_updated'))
      } else {
        await createMutation.mutateAsync({ ...values, is_active: true })
        toast.success(t('recurring_added'))
      }
      setShowForm(false)
    } catch {
      toast.error(t('recurring_save_fail'))
    }
  }

  async function toggleActive(item: RecurringItem) {
    await updateMutation.mutateAsync({ id: item.id, data: { is_active: !item.is_active } })
    toast.success(item.is_active ? t('recurring_deactivated') : t('recurring_activated'))
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success(t('recurring_deleted'))
    } catch { toast.error(t('recurring_delete_fail')) }
    finally { setDeleteId(null) }
  }

  async function handleRefresh() {
    setTodayKey(new Date().toISOString().slice(0, 10))
    await refetch()
  }

  return (
    <div className="pb-6">
      <PageHeader
        title={t('recurring_title')}
        action={
          <button
            onClick={openCreate}
            className="tap-target flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition active:scale-95"
            aria-label={t('recurring_add')}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* 이번 달 합계 배너 */}
      <div className="mx-4 mt-4 flex items-center justify-between rounded-3xl border border-white/70 bg-gradient-to-br from-rose-50 via-white to-white px-4 py-4 shadow-sm dark:border-slate-800/70 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900/60">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">{t('recurring_total')}</p>
          <p className="mt-1 text-[clamp(1.35rem,4vw,1.9rem)] font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totalMonthly, defaultCurrency)}
          </p>
        </div>
        <button
          onClick={() => void handleRefresh()}
          className="tap-target inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-rose-500 shadow-sm transition hover:bg-white dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
          aria-label={t('recurring_refresh')}
          title={t('recurring_refresh')}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* 목록 */}
      <div className="card mx-4 mt-4 divide-y divide-slate-100/80 overflow-hidden rounded-3xl dark:divide-slate-800/70">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('recurring_loading')}</p>
        ) : !recurringItems?.length ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('recurring_empty')}</p>
        ) : (
          recurringItems.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-5 py-4 transition ${!item.is_active ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.description}</span>
                  {item.categories && (
                    <CategoryBadge color={item.categories.color} label={item.categories.name} size="sm" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{tr.recurring_day_label(item.day_of_month)} · {item.payment_method}</p>
              </div>
              <span className="text-sm font-bold text-rose-500 tabular-nums shrink-0">
                {formatCurrency(item.amount, item.currency ?? defaultCurrency)}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  title={item.is_active ? t('recurring_deactivated') : t('recurring_activated')}
                  className={`rounded-xl p-2 transition ${item.is_active ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom sheet 폼 */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-2 pt-8 sm:items-center sm:p-4"
          onClick={() => setShowForm(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] border border-white/70 bg-white/95 p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[88dvh] overflow-y-auto overscroll-contain shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 text-base font-bold text-slate-900 dark:text-white">
              {editItem ? t('recurring_form_title_edit') : t('recurring_form_title_add')}
            </h3>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('recurring_category')}</label>
                <select
                  {...register('category_id')}
                  className={inputClass}
                >
                  <option value="">{t('recurring_category_select')}</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <p className="mt-1 text-xs text-rose-500">{errors.category_id.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('recurring_desc')}</label>
                <input {...register('description')} placeholder={t('form_description_placeholder')} className={inputClass} />
                {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('recurring_amount')}</label>
                  <input {...register('amount')} type="number" step="0.01" placeholder="0" className={inputClass} />
                  {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('settings_currency_title')}</label>
                  <select {...register('currency')} className={inputClass}>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('recurring_day')}</label>
                  <input {...register('day_of_month')} type="number" min={1} max={31} placeholder="1" className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('recurring_payment')}</label>
                  <select {...register('payment_method')} className={inputClass}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t('recurring_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white transition hover:from-indigo-600 hover:to-violet-600 disabled:opacity-60"
                >
                  {t('recurring_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('recurring_delete_title')}
        description={t('recurring_delete_desc')}
        danger
        confirmLabel={t('delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
