import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { TransactionForm } from '@/components/features/transactions/TransactionForm'

export default function TransactionNew() {
  const navigate = useNavigate()
  return (
    <div>
      <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">거래 추가</h1>
      </header>
      <TransactionForm />
    </div>
  )
}
