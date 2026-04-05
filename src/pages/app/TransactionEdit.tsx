import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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
    <div>
      <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">거래 수정</h1>
      </header>
      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : tx ? (
        <TransactionForm initialValues={tx} editId={id} />
      ) : (
        <p className="p-4 text-gray-500">거래를 찾을 수 없습니다</p>
      )}
    </div>
  )
}
