import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, List, Edit2, Trash2 } from 'lucide-react'
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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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

  const hasActiveFilter = !!(filters.categoryId || filters.type)

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
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-600 transition active:scale-95"
            aria-label="거래 추가"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* Search + filter bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:bg-slate-50 dark:focus:bg-slate-700 transition"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            showFilters || hasActiveFilter
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label="필터"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Month + active filters */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-2">
          <MonthSelector value={filters.month} onChange={setMonth} />
          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition"
            >
              필터 초기화
            </button>
          )}
        </div>

        {showFilters && (
          <div className="px-4 pb-3 space-y-2.5">
            {/* Type filter */}
            <div className="flex gap-2">
              {(['지출', '수입'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(filters.type === t ? null : t)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    filters.type === t
                      ? t === '지출'
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(filters.categoryId === cat.id ? null : cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filters.categoryId === cat.id ? 'text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
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
          <div className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
            {Array.from({ length: 8 }).map((_, i) => <TransactionSkeleton key={i} />)}
          </div>
        ) : !allTransactions?.length ? (
          <EmptyState
            icon={<List className="h-14 w-14" />}
            title="거래내역이 없습니다"
            description="오른쪽 상단 + 버튼을 눌러 첫 거래를 입력해보세요"
          />
        ) : (
          Object.entries(grouped).map(([dateLabel, txs]) => {
            const dayExpense = txs.filter(t => t.type === '지출').reduce((s, t) => s + t.amount, 0)
            return (
              <div key={dateLabel}>
                {/* Date group header */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950/60">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dateLabel}</span>
                  {dayExpense > 0 && (
                    <span className="text-xs font-semibold text-rose-400 tabular-nums">
                      -{formatCurrency(dayExpense)}
                    </span>
                  )}
                </div>
                <div className="bg-white dark:bg-slate-900">
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
            )
          })
        )}
        <div ref={loaderRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
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
      className="relative flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0 active:bg-slate-50 dark:active:bg-slate-800/30 cursor-pointer"
      onClick={() => setShowActions((v) => !v)}
    >
      {/* Category avatar */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{
          backgroundColor: `${tx.categories?.color ?? '#94a3b8'}15`,
          color: tx.categories?.color ?? '#94a3b8',
        }}
      >
        {tx.categories?.name?.[0] ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {tx.description}
          </span>
          {tx.categories && (
            <CategoryBadge color={tx.categories.color} label={tx.categories.name} size="sm" />
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{tx.payment_method}</p>
      </div>

      <span
        className={`text-sm font-semibold tabular-nums shrink-0 ${
          tx.type === '지출' ? 'text-rose-500' : 'text-emerald-500'
        }`}
      >
        {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
      </span>

      {/* Inline action buttons — appear on tap, positioned to the right */}
      {showActions && (
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-lg p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
          >
            <Edit2 className="h-3.5 w-3.5" />
            수정
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            삭제
          </button>
        </div>
      )}
    </div>
  )
}
