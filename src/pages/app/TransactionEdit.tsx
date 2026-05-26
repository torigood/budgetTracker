import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDateShort } from '@/utils/format'

export default function TransactionEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  return (
    <div className="pb-6">
      <header className="fintra-page-header">
        <div className="flex min-w-0 items-start gap-3 w-full">
          <button
            onClick={() => navigate(-1)}
            className="fintra-icon-button mt-0.5 h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-2xl shadow-[var(--fintra-shadow-soft)] dark:hover:bg-slate-800"
            aria-label="뒤로 가기"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="fintra-kicker">Edit transaction</p>
            <h1 className="fintra-page-title mt-1 truncate dark:text-white">거래 수정</h1>
            <p className="mt-2 text-sm font-medium leading-6 text-[var(--fintra-ink-2)]">
              금액, 카테고리, 날짜와 메모를 차분하게 조정하세요.
            </p>
          </div>
        </div>
      </header>
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : tx ? (
        <>
          <div className="mx-4 mt-2 rounded-[1.9rem] border border-white/80 bg-[linear-gradient(145deg,#005247_0%,#006b5b_100%)] p-5 text-white shadow-[0_22px_50px_rgba(0,107,91,0.18)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/62">
              Current record
            </p>
            <p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.01em] tabular-nums">
              {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] bg-white/10 px-3.5 py-3 text-sm">
              <span className="min-w-0 truncate font-semibold">{tx.description}</span>
              <span className="shrink-0 text-xs font-bold text-white/70">{formatDateShort(tx.date)}</span>
            </div>
          </div>
          <TransactionForm initialValues={tx} editId={id} />
        </>
      ) : (
        <p className="p-8 text-center text-sm text-slate-400">거래를 찾을 수 없습니다</p>
      )}
    </div>
  )
}
