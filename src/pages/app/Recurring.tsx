import { useState } from 'react'
import { Plus, Edit2, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRecurringItems, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, type RecurringWithCategory } from '@/lib/hooks/useRecurring'
import { useCategories } from '@/lib/hooks/useCategories'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryBadge } from '@/components/ui/Badge'
import { PAYMENT_METHODS } from '@/types/app'
import { formatCurrency } from '@/utils/format'
import type { RecurringItem } from '@/types/app'

const schema = z.object({
  category_id: z.string().min(1, '카테고리 선택 필요'),
  description: z.string().min(1, '내용 입력 필요'),
  amount: z.coerce.number().positive('금액을 입력해주세요'),
  currency: z.string().min(1),
  payment_method: z.string().min(1),
  day_of_month: z.coerce.number().int().min(1).max(31),
})
type FormValues = z.infer<typeof schema>

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition'

export default function Recurring() {
  const { data: items, isLoading } = useRecurringItems()
  const { data: categories } = useCategories()
  const { currency: defaultCurrency } = useUIStore()
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const deleteMutation = useDeleteRecurring()

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<RecurringItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { payment_method: '자동지출', day_of_month: 1 },
  })

  const recurringItems = items as RecurringWithCategory[] | undefined
  const totalMonthly = recurringItems?.filter((i) => i.is_active).reduce((sum, i) => sum + i.amount, 0) ?? 0

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
        toast.success('수정됐습니다')
      } else {
        await createMutation.mutateAsync({ ...values, is_active: true })
        toast.success('자동지출이 추가됐습니다')
      }
      setShowForm(false)
    } catch {
      toast.error('저장 실패')
    }
  }

  async function toggleActive(item: RecurringItem) {
    await updateMutation.mutateAsync({ id: item.id, data: { is_active: !item.is_active } })
    toast.success(item.is_active ? '비활성화됐습니다' : '활성화됐습니다')
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('삭제됐습니다')
    } catch { toast.error('삭제 실패') }
    finally { setDeleteId(null) }
  }

  return (
    <div>
      <PageHeader
        title="자동지출"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-600 transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> 추가
          </button>
        }
      />

      {/* 이번 달 합계 배너 */}
      <div className="mx-4 mt-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 px-4 py-3.5 flex justify-between items-center">
        <div>
          <p className="text-xs text-rose-400 font-medium">이번 달 자동지출 합계</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
            {formatCurrency(totalMonthly, defaultCurrency)}
          </p>
        </div>
        <span className="text-2xl">🔄</span>
      </div>

      {/* 목록 */}
      <div className="mt-4 card mx-4 divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
        ) : !recurringItems?.length ? (
          <p className="py-8 text-center text-sm text-slate-400">자동지출이 없습니다</p>
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
                <p className="mt-0.5 text-xs text-slate-400">매달 {item.day_of_month}일 · {item.payment_method}</p>
              </div>
              <span className="text-sm font-bold text-rose-500 tabular-nums shrink-0">
                {formatCurrency(item.amount, item.currency ?? defaultCurrency)}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  title={item.is_active ? '비활성화' : '활성화'}
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
              {editItem ? '자동지출 수정' : '자동지출 추가'}
            </h3>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">카테고리</label>
                <select
                  {...register('category_id')}
                  className={inputClass}
                >
                  <option value="">카테고리 선택</option>
                  {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category_id && <p className="mt-1 text-xs text-rose-500">{errors.category_id.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">내용</label>
                <input {...register('description')} placeholder="예: 넷플릭스 구독" className={inputClass} />
                {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">금액</label>
                  <input {...register('amount')} type="number" step="0.01" placeholder="0" className={inputClass} />
                  {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message}</p>}
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">통화</label>
                  <select {...register('currency')} className={inputClass}>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">매달 N일</label>
                  <input {...register('day_of_month')} type="number" min={1} max={31} placeholder="1" className={inputClass} />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">결제수단</label>
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
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60 transition"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="삭제할까요?"
        description="이 자동지출 항목이 영구 삭제됩니다."
        danger
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
