import { useState } from 'react'
import { Plus, Edit2, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRecurringItems, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, type RecurringWithCategory } from '@/lib/hooks/useRecurring'
import { useCategories } from '@/lib/hooks/useCategories'
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
  payment_method: z.string().min(1),
  day_of_month: z.coerce.number().int().min(1).max(31),
})
type FormValues = z.infer<typeof schema>

export default function Recurring() {
  const { data: items, isLoading } = useRecurringItems()
  const { data: categories } = useCategories()
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const deleteMutation = useDeleteRecurring()

  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<RecurringItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { payment_method: '자동지출', day_of_month: 1 },
  })

  const totalMonthly = (items as RecurringWithCategory[] | undefined)
    ?.filter((i) => i.is_active)
    .reduce((sum, i) => sum + i.amount, 0) ?? 0

  function openCreate() {
    setEditItem(null)
    reset({ payment_method: '자동지출', day_of_month: 1 })
    setShowForm(true)
  }

  function openEdit(item: RecurringItem) {
    setEditItem(item)
    reset({
      category_id: item.category_id,
      description: item.description,
      amount: item.amount,
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
          <button onClick={openCreate} className="flex items-center gap-1 rounded-xl bg-blue-500 px-3 py-1.5 text-sm font-medium text-white">
            <Plus className="h-4 w-4" /> 추가
          </button>
        }
      />

      {/* 이번 달 합계 */}
      <div className="mx-4 mt-4 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 shadow-sm flex justify-between items-center">
        <span className="text-sm text-gray-500">이번 달 자동지출 합계</span>
        <span className="text-base font-bold text-red-500">{formatCurrency(totalMonthly)}</span>
      </div>

      {/* 목록 */}
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">로딩 중...</p>
        ) : !(items as RecurringWithCategory[])?.length ? (
          <p className="py-8 text-center text-sm text-gray-400">자동지출이 없습니다</p>
        ) : (
          (items as RecurringWithCategory[]).map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${!item.is_active ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</span>
                  {item.categories && <CategoryBadge color={item.categories.color} label={item.categories.name} size="sm" />}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">매달 {item.day_of_month}일 · {item.payment_method}</p>
              </div>
              <span className="text-sm font-semibold text-red-500 tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleActive(item)} className={`p-1.5 rounded-lg ${item.is_active ? 'text-blue-500' : 'text-gray-300'}`}>
                  <Power className="h-4 w-4" />
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 rounded-lg">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-gray-400 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 폼 시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold">{editItem ? '수정' : '자동지출 추가'}</h3>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-3">
              <select {...register('category_id')} className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm">
                <option value="">카테고리 선택</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
              <input {...register('description')} placeholder="내용" className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm" />
              <input {...register('amount')} type="number" step="0.01" placeholder="금액" className="w-full rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm" />
              <div className="flex gap-2">
                <input {...register('day_of_month')} type="number" min={1} max={31} placeholder="날짜(일)" className="w-24 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm" />
                <select {...register('payment_method')} className="flex-1 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border dark:border-gray-700 py-2.5 text-sm font-medium">취소</button>
                <button type="submit" className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="삭제할까요?" danger confirmLabel="삭제" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
