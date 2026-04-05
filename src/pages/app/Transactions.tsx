import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, List } from 'lucide-react'
import { toast } from 'sonner'
import { useTransactions, useDeleteTransaction } from '@/lib/hooks/useTransactions'
import { useCategories } from '@/lib/hooks/useCategories'
import { useFilterStore } from '@/lib/stores/filter.store'
import { PageHeader } from '@/components/ui/PageHeader'
import { TransactionSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryBadge } from '@/components/ui/Badge'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { formatCurrency, getRelativeDate } from '@/utils/format'
import type { TransactionType } from '@/types/app'

type TxWithCategory = {
  id: string
  date: string
  type: TransactionType
  description: string
  amount: number
  currency: string
  payment_method: string
  categories: { id: string; name: string; color: string; icon: string } | null
}

export default function Transactions() {
  const navigate = useNavigate()
  const { filters, setMonth, setCategoryId, setType, setSearch, resetFilters } = useFilterStore()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTransactions(filters)
  const { data: categories } = useCategories()
  const deleteMutation = useDeleteTransaction()

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) void fetchNextPage() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const allTransactions = data?.pages.flat() as TxWithCategory[] | undefined

  // Group by date
  const grouped: Record<string, TxWithCategory[]> = {}
  allTransactions?.forEach((tx) => {
    const key = getRelativeDate(tx.date)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(tx)
  })

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('거래가 삭제됐습니다')
    } catch {
      toast.error('삭제 실패')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="거래내역"
        action={
          <button
            onClick={() => navigate('/transactions/new')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            showFilters || filters.categoryId || filters.type
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Month + filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-2">
          <MonthSelector value={filters.month} onChange={setMonth} />
          {(filters.categoryId || filters.type) && (
            <button onClick={resetFilters} className="text-xs text-blue-500">초기화</button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-3 space-y-2">
            {/* Type filter */}
            <div className="flex gap-2">
              {(['지출', '수입'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(filters.type === t ? null : t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filters.type === t
                      ? t === '지출' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(filters.categoryId === cat.id ? null : cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                    filters.categoryId === cat.id ? 'text-white' : 'text-gray-600 bg-gray-100 dark:bg-gray-800'
                  }`}
                  style={filters.categoryId === cat.id ? { backgroundColor: cat.color } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 8 }).map((_, i) => <TransactionSkeleton key={i} />)}
          </div>
        ) : !allTransactions?.length ? (
          <EmptyState
            icon={<List className="h-16 w-16" />}
            title="거래내역이 없습니다"
            description="+ 버튼을 눌러 첫 거래를 입력해보세요"
          />
        ) : (
          Object.entries(grouped).map(([dateLabel, txs]) => (
            <div key={dateLabel}>
              <div className="sticky top-[calc(theme(spacing.16)+1px)] z-[5] bg-gray-50 dark:bg-gray-950 px-4 py-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase">{dateLabel}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {formatCurrency(txs.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {txs.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    onEdit={() => navigate(`/transactions/${tx.id}/edit`)}
                    onDelete={() => setDeleteId(tx.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={loaderRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="거래를 삭제할까요?"
        description="삭제된 거래는 복구할 수 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}

function TransactionRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: TxWithCategory
  onEdit: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 dark:active:bg-gray-800 transition"
      onClick={() => setShowActions(!showActions)}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
        style={{ backgroundColor: `${tx.categories?.color ?? '#6b7280'}20` }}
      >
        <span style={{ color: tx.categories?.color ?? '#6b7280' }}>●</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {tx.description}
          </span>
          {tx.categories && (
            <CategoryBadge color={tx.categories.color} label={tx.categories.name} size="sm" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{tx.payment_method}</p>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${
          tx.type === '지출' ? 'text-red-500' : 'text-blue-500'
        }`}
      >
        {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
      </span>

      {showActions && (
        <div className="absolute right-4 z-10 flex gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-500 hover:bg-blue-50"
          >
            수정
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}
