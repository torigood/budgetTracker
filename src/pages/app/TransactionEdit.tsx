import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PageHeader } from '@/components/ui/PageHeader'

export default function TransactionEdit() {
  const { id } = useParams<{ id: string }>()

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
    <div>
      <PageHeader title="거래 수정" subtitle="내역 편집" back />
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : tx ? (
        <TransactionForm initialValues={tx} editId={id} />
      ) : (
        <p className="p-8 text-center text-sm text-slate-400">거래를 찾을 수 없습니다</p>
      )}
    </div>
  )
}
