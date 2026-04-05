import { TransactionForm } from '@/components/features/transactions/TransactionForm'
import { PageHeader } from '@/components/ui/PageHeader'

export default function TransactionNew() {
  return (
    <div className="pb-6">
      <PageHeader title="거래 추가" subtitle="새 내역" back />
      <TransactionForm />
    </div>
  )
}
