import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CreditCard, FileText, Store, Tag } from 'lucide-react'
import { useCreateTransaction, useUpdateTransaction } from '@/lib/hooks/useTransactions'
import { useCategories } from '@/lib/hooks/useCategories'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useFilterStore } from '@/lib/stores/filter.store'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PAYMENT_METHODS } from '@/types/app'
import { todayISO } from '@/utils/format'
import { checkBudgetAlert, checkAnomalyAlert, checkMonthlyBudgetAlert, getPermission } from '@/lib/hooks/useNotifications'
import type { Transaction } from '@/types/app'
import type { CurrencyCode } from '@/lib/stores/ui.store'

const schema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요'),
  type: z.union([z.literal('지출'), z.literal('수입')]),
  category_id: z.string().min(1, '카테고리를 선택해주세요'),
  description: z.string().min(1, '내용을 입력해주세요'),
  amount: z.coerce.number().positive('금액을 입력해주세요'),
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
  'w-full rounded-[1.35rem] border border-transparent bg-[#f5f6f8] px-4 py-3.5 text-base font-medium text-[#141716] outline-none transition placeholder:text-[#a3aaa7] focus:bg-white focus:ring-4 focus:ring-[#006b5b]/10 dark:bg-slate-800 dark:text-white'

const labelClass = 'mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b9390] dark:text-slate-400'

export function TransactionForm({ initialValues, editId, receiptId }: TransactionFormProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { resetFilters, setMonth } = useFilterStore()
  const setDashboardMonth = useUIStore((s) => s.setSelectedMonth)
  const { currency: defaultCurrency } = useUIStore()
  const { data: categories } = useCategories()
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    (initialValues?.currency as CurrencyCode) ?? defaultCurrency
  )
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
        await updateMutation.mutateAsync({ id: editId, data: { ...values, currency: selectedCurrency } })
        toast.success('거래가 수정됐습니다')
      } else {
        await createMutation.mutateAsync({
          ...values,
          user_id: user!.id,
          currency: selectedCurrency,
          memo: values.memo || null,
          receipt_id: receiptId ?? null,
        })
        toast.success('거래가 저장됐습니다')

        // Run notification checks for expense transactions
        if (values.type === '지출' && getPermission() === 'granted') {
          const catName = categories?.find(c => c.id === values.category_id)?.name ?? ''
          void checkBudgetAlert(values.category_id, catName)
          void checkMonthlyBudgetAlert()
          void checkAnomalyAlert(selectedCurrency)
        }
      }

      // After save, show the month where this transaction actually belongs.
      resetFilters()
      setMonth(values.date.slice(0, 7))
      setDashboardMonth(values.date.slice(0, 7))
      navigate('/transactions')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장 실패. 다시 시도해주세요'
      toast.error(msg)
    }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4 px-4 pb-8 pt-3">
      {/* 지출/수입 토글 */}
      <div className="rounded-[1.7rem] border border-white/80 bg-white p-2 shadow-[var(--fintra-shadow-soft)] dark:border-slate-700 dark:bg-slate-900/70">
        <p className={labelClass}>Type</p>
        <div className="flex overflow-hidden rounded-[1.25rem] bg-[#f5f6f8] p-1">
        {(['지출', '수입'] as const).map((t) => (
          <label
            key={t}
            className={`flex-1 cursor-pointer py-3 text-center text-sm font-bold rounded-[1rem] transition-all ${
              selectedType === t
                ? t === '지출'
                  ? 'bg-[#c46f63] text-white shadow-[var(--fintra-shadow-soft)]'
                  : 'bg-[#006b5b] text-white shadow-[var(--fintra-shadow-soft)]'
                : 'text-[#7d8582] hover:text-[#141716] dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <input type="radio" value={t} {...register('type')} className="sr-only" />
            {t}
          </label>
        ))}
        </div>
      </div>

      {/* 금액 + 통화 */}
      <section className="rounded-[1.8rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-card)] dark:border-slate-700 dark:bg-slate-900/70">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              label="Amount"
              currency={selectedCurrency}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.amount?.message}
            />
          )}
        />

        {/* 통화 선택 */}
        <div className="mt-4">
          <label className={labelClass}>통화</label>
          <div className="flex gap-2 overflow-x-auto pb-1 fintra-horizontal-scroll">
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCurrency(c.code)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                selectedCurrency === c.code
                  ? 'border-[#006b5b] bg-[#006b5b] text-white shadow-[0_10px_20px_rgba(0,107,91,0.16)]'
                  : 'border-transparent bg-[#f5f6f8] text-[#7d8582]'
              }`}
            >
              {c.code}
            </button>
          ))}
          </div>
        </div>
      </section>

      {/* 날짜 */}
      <section className="rounded-[1.8rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ef] text-[#006b5b] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
          </span>
          <label className="text-sm font-semibold text-[#141716] dark:text-white">날짜 조정</label>
        </div>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              error={errors.date?.message}
            />
          )}
        />
      </section>

      {/* 카테고리 */}
      <section className="rounded-[1.8rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f1e8] text-[#006b5b]">
            <Tag className="h-4 w-4" />
          </span>
          <label className="text-sm font-semibold text-[#141716] dark:text-white">카테고리</label>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {categories?.map((cat) => (
            <label
              key={cat.id}
              className={`flex min-h-[82px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[1.15rem] border transition-all active:scale-95 ${
                selectedCategoryId === cat.id
                  ? 'shadow-[var(--fintra-shadow-soft)]'
                  : 'border-transparent bg-[#f5f6f8] dark:bg-slate-800/60'
              }`}
              style={selectedCategoryId === cat.id ? { backgroundColor: `${cat.color}14`, borderColor: `${cat.color}66` } : {}}
            >
              <input type="radio" value={cat.id} {...register('category_id')} className="sr-only" />
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-sm"
                style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
              >
                {cat.icon || cat.name[0]}
              </span>
              <span className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-[#5f6868] dark:text-slate-400">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
        {errors.category_id && <p className="mt-1.5 text-xs text-rose-500">{errors.category_id.message}</p>}
      </section>

      {/* 내용 */}
      <section className="rounded-[1.8rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f4ef] text-[#006b5b]">
            <Store className="h-4 w-4" />
          </span>
          <label className="text-sm font-semibold text-[#141716] dark:text-white">가맹점 / 내용</label>
        </div>
        <input
          {...register('description')}
          placeholder="예: 스타벅스 아메리카노"
          className={inputClass}
        />
        {errors.description && <p className="mt-1.5 text-xs text-rose-500">{errors.description.message}</p>}
      </section>

      {/* 결제수단 */}
      <section className="rounded-[1.8rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eee5d8] text-[#9a6b37]">
            <CreditCard className="h-4 w-4" />
          </span>
          <label className="text-sm font-semibold text-[#141716] dark:text-white">결제수단</label>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                watch('payment_method') === m
                  ? 'border-[#006b5b] bg-[#006b5b] text-white shadow-[0_10px_20px_rgba(0,107,91,0.16)]'
                  : 'border-transparent bg-[#f5f6f8] text-[#7d8582]'
              }`}
            >
              <input type="radio" value={m} {...register('payment_method')} className="sr-only" />
              {m}
            </label>
          ))}
        </div>
      </section>

      {/* 메모 */}
      <section className="rounded-[1.8rem] border border-white/80 bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-700 dark:bg-slate-900/70">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f1e8] text-[#006b5b]">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <label className="text-sm font-semibold text-[#141716] dark:text-white">메모</label>
            <p className="text-[11px] font-medium text-[#8b9390]">선택 사항</p>
          </div>
        </div>
        <textarea
          {...register('memo')}
          rows={4}
          placeholder="추가 메모..."
          className={`${inputClass} resize-none`}
        />
      </section>

      {/* 저장 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 mt-1 flex h-14 items-center justify-center gap-2 rounded-[1.35rem] text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60 ${
          selectedType === '지출'
            ? 'bg-[#c46f63] shadow-[0_18px_36px_rgba(196,111,99,0.22)]'
            : 'bg-[#006b5b] shadow-[0_18px_36px_rgba(0,107,91,0.22)]'
        }`}
      >
        {isSubmitting && <LoadingSpinner size="sm" />}
        {editId ? '변경사항 저장' : '저장하기'}
      </button>
    </form>
  )
}
