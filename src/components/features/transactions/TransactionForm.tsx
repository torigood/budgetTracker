import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateTransaction, useUpdateTransaction } from '@/lib/hooks/useTransactions'
import { useCategories } from '@/lib/hooks/useCategories'
import { useAuthStore } from '@/lib/stores/auth.store'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PAYMENT_METHODS } from '@/types/app'
import { todayISO } from '@/utils/format'
import type { Transaction } from '@/types/app'

const schema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  type: z.union([z.literal('지출'), z.literal('수입')]),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  description: z.string().min(1, '내용을 입력해주세요'),
  amount: z.number().positive('금액을 입력해주세요'),
  payment_method: z.string().min(1, '결제수단을 선택해주세요'),
  memo: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface TransactionFormProps {
  initialValues?: Partial<Transaction>
  editId?: string
  receiptId?: string
}

export function TransactionForm({ initialValues, editId, receiptId }: TransactionFormProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: categories } = useCategories()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      date: initialValues?.date ?? todayISO(),
      type: initialValues?.type ?? '지출',
      category_id: initialValues?.category_id ?? '',
      description: initialValues?.description ?? '',
      amount: initialValues?.amount ?? ('' as unknown as number),
      payment_method: initialValues?.payment_method ?? '크레딧',
      memo: initialValues?.memo ?? '',
    },
  })

  const selectedType = watch('type')
  const selectedCategoryId = watch('category_id')

  async function onSubmit(values: FormValues) {
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: values })
        toast.success('거래가 수정됐습니다')
      } else {
        await createMutation.mutateAsync({
          ...values,
          user_id: user!.id,
          currency: 'CAD',
          memo: values.memo || null,
          receipt_id: receiptId ?? null,
        })
        toast.success('거래가 저장됐습니다')
      }
      navigate('/transactions')
    } catch {
      toast.error('저장 실패. 다시 시도해주세요')
    }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-5 p-4">
      {/* 지출/수입 토글 */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {(['지출', '수입'] as const).map((t) => (
          <label
            key={t}
            className={`flex-1 cursor-pointer py-3 text-center text-sm font-semibold transition ${
              selectedType === t
                ? t === '지출' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-400'
            }`}
          >
            <input type="radio" value={t} {...register('type')} className="sr-only" />
            {t}
          </label>
        ))}
      </div>

      {/* 금액 */}
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label="금액"
            currency="CAD"
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      {/* 날짜 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">날짜</label>
        <input
          type="date"
          {...register('date')}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
        />
        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
      </div>

      {/* 카테고리 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">카테고리</label>
        <div className="grid grid-cols-4 gap-2">
          {categories?.map((cat) => (
            <label
              key={cat.id}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl p-2 border-2 transition ${
                selectedCategoryId === cat.id
                  ? 'border-transparent'
                  : 'border-transparent bg-gray-50 dark:bg-gray-800'
              }`}
              style={selectedCategoryId === cat.id ? { backgroundColor: `${cat.color}20`, borderColor: cat.color } : {}}
            >
              <input type="radio" value={cat.id} {...register('category_id')} className="sr-only" />
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name[0]}
              </span>
              <span className="text-[11px] text-center text-gray-600 dark:text-gray-400 leading-tight">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
        {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
      </div>

      {/* 내용 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">내용</label>
        <input
          {...register('description')}
          placeholder="예: 스타벅스 아메리카노"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
        />
        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
      </div>

      {/* 결제수단 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">결제수단</label>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                watch('payment_method') === m
                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              <input type="radio" value={m} {...register('payment_method')} className="sr-only" />
              {m}
            </label>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          메모 <span className="text-gray-400">(선택)</span>
        </label>
        <textarea
          {...register('memo')}
          rows={2}
          placeholder="추가 메모..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* 저장 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-4 text-base font-semibold text-white active:bg-blue-600 disabled:opacity-60 transition"
      >
        {isSubmitting && <LoadingSpinner size="sm" />}
        {editId ? '수정하기' : '저장하기'}
      </button>
    </form>
  )
}
