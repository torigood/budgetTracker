import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateTransaction, useUpdateTransaction } from '@/lib/hooks/useTransactions'
import { useCategories } from '@/lib/hooks/useCategories'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
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

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 transition'

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide'

export function TransactionForm({ initialValues, editId, receiptId }: TransactionFormProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currency: defaultCurrency } = useUIStore()
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
          currency: initialValues?.currency ?? defaultCurrency,
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
      <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 p-1 gap-1 bg-slate-50 dark:bg-slate-800/50">
        {(['지출', '수입'] as const).map((t) => (
          <label
            key={t}
            className={`flex-1 cursor-pointer py-2.5 text-center text-sm font-semibold rounded-xl transition-all ${
              selectedType === t
                ? t === '지출'
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25'
                  : 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
            currency={initialValues?.currency ?? defaultCurrency}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.amount?.message}
          />
        )}
      />

      {/* 날짜 */}
      <div>
        <label className={labelClass}>날짜</label>
        <input
          type="date"
          {...register('date')}
          className={inputClass}
        />
        {errors.date && <p className="mt-1.5 text-xs text-rose-500">{errors.date.message}</p>}
      </div>

      {/* 카테고리 */}
      <div>
        <label className={labelClass}>카테고리</label>
        <div className="grid grid-cols-4 gap-2">
          {categories?.map((cat) => (
            <label
              key={cat.id}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-2.5 border-2 transition-all ${
                selectedCategoryId === cat.id
                  ? 'border-transparent shadow-sm'
                  : 'border-transparent bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              style={selectedCategoryId === cat.id ? { backgroundColor: `${cat.color}15`, borderColor: cat.color } : {}}
            >
              <input type="radio" value={cat.id} {...register('category_id')} className="sr-only" />
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name[0]}
              </span>
              <span className="text-[10px] text-center text-slate-600 dark:text-slate-400 leading-tight font-medium">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
        {errors.category_id && <p className="mt-1.5 text-xs text-rose-500">{errors.category_id.message}</p>}
      </div>

      {/* 내용 */}
      <div>
        <label className={labelClass}>내용</label>
        <input
          {...register('description')}
          placeholder="예: 스타벅스 아메리카노"
          className={inputClass}
        />
        {errors.description && <p className="mt-1.5 text-xs text-rose-500">{errors.description.message}</p>}
      </div>

      {/* 결제수단 */}
      <div>
        <label className={labelClass}>결제수단</label>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                watch('payment_method') === m
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
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
        <label className={labelClass}>
          메모 <span className="normal-case text-slate-400 font-normal">(선택)</span>
        </label>
        <textarea
          {...register('memo')}
          rows={2}
          placeholder="추가 메모..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* 저장 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60 ${
          selectedType === '지출'
            ? 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/20'
            : 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'
        }`}
      >
        {isSubmitting && <LoadingSpinner size="sm" />}
        {editId ? '수정하기' : '저장하기'}
      </button>
    </form>
  )
}
