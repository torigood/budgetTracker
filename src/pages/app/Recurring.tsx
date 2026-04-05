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

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'

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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { payment_method: '자동지출', day_of_month: 1 },
  })

  const recurringItems = items as RecurringWithCategory[] | undefined
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
    <div>
      <PageHeader
        title={t('recurring_title')}
        action={
          <button
            onClick={openCreate}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-600 transition active:scale-95"
            aria-label={t('recurring_add')}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* 이번 달 합계 배너 */}
      <div className="mx-4 mt-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3.5 flex justify-between items-center">
        <div>
          <p className="text-xs text-rose-400 font-medium">{t('recurring_total')}</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
            {formatCurrency(totalMonthly, defaultCurrency)}
          </p>
        </div>
        <button
          onClick={() => void handleRefresh()}
          className="tap-target inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-rose-500 transition hover:bg-white dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
          aria-label={t('recurring_refresh')}
          title={t('recurring_refresh')}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 목록 */}
      <div className="mt-4 card mx-4 divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('recurring_loading')}</p>
        ) : !recurringItems?.length ? (
          <p className="py-8 text-center text-sm text-slate-400">{t('recurring_empty')}</p>
        ) : (
          recurringItems.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3.5 transition ${!item.is_active ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{item.description}</span>
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
                  className={`p-2 rounded-lg transition ${item.is_active ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition"
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
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={() => setShowForm(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 max-h-[90vh] overflow-y-auto shadow-xl"
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
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t('recurring_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition"
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
