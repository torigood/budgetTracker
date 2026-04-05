import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, SlidersHorizontal, List, Edit2, Trash2, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useTransactions, useDeleteTransaction } from '@/lib/hooks/useTransactions'
import { useCategories } from '@/lib/hooks/useCategories'
import { useFilterStore } from '@/lib/stores/filter.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { PageHeader } from '@/components/ui/PageHeader'
import { TransactionSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryBadge } from '@/components/ui/Badge'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, getRelativeDate, getMonthRange } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { useT } from '@/lib/hooks/useT'
import { useUIStore } from '@/lib/stores/ui.store'
import { translations } from '@/lib/i18n'
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

function usePrevMonthSummary(currentMonth: string, enabled: boolean) {
  return useQuery({
    queryKey: ['prev-month-summary', currentMonth],
    enabled,
    queryFn: async () => {
      const [y, m] = currentMonth.split('-').map(Number)
      const prevDate = new Date(y, m - 2, 1)
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
      const { start, end } = getMonthRange(prevMonth)
      const { data } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('type', '지출')
        .gte('date', start)
        .lte('date', end)
      const byCurrency: Record<string, number> = {}
      ;(data ?? []).forEach((r: { amount: number; currency: string }) => {
        byCurrency[r.currency] = (byCurrency[r.currency] ?? 0) + r.amount
      })
      return Object.entries(byCurrency)
        .sort((a, b) => b[1] - a[1])
        .map(([currency, amount]) => ({ currency, amount }))
    },
  })
}

export default function Transactions() {
  const navigate = useNavigate()
  const t = useT()
  const { lang } = useUIStore()
  const tr = translations[lang]
  const { filters, setMonth, setCategoryId, setType, setSearch, toggleSortOrder, resetFilters } = useFilterStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchAll, setSearchAll] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTransactions(filters, searchAll && !!filters.search)
  const { data: categories } = useCategories()
  const deleteMutation = useDeleteTransaction()
  const swipe = useSwipeMonth(filters.month, setMonth)

  const hasActiveFilter = !!(filters.categoryId || filters.type)
  const allTransactions = data?.pages.flat() as TxWithCategory[] | undefined
  const isEmpty = !isLoading && !allTransactions?.length && !filters.categoryId && !filters.type && !filters.search
  const { data: prevMonthRows } = usePrevMonthSummary(filters.month, isEmpty)

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

  // Group by date
  const grouped: Record<string, TxWithCategory[]> = {}
  allTransactions?.forEach((tx) => {
    const key = getRelativeDate(tx.date, lang)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(tx)
  })

  async function handleDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success(t('tx_deleted'))
    } catch {
      toast.error(t('tx_delete_fail'))
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-full" {...swipe}>
      <PageHeader
        title={t('tx_title')}
        action={
          <button
            onClick={() => navigate('/transactions/new')}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 hover:bg-indigo-600 transition active:scale-95"
            aria-label={t('dashboard_add_prompt')}
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {/* Search + filter bar */}
      <div className="px-4 pt-2.5 pb-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('tx_search')}
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 pl-9 pr-4 py-2 text-base text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:bg-slate-50 dark:focus:bg-slate-700 transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
          className={`tap-target flex h-11 w-11 items-center justify-center rounded-xl transition ${
            showFilters || hasActiveFilter
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          aria-label={t('tx_filter_reset')}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        </div>
        {/* 전체 기간 검색 토글 — 검색어 있을 때만 표시 */}
        {filters.search && (
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => setSearchAll(false)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                !searchAll ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {t('tx_search_month')}
            </button>
            <button
              onClick={() => setSearchAll(true)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                searchAll ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {t('tx_search_all')}
            </button>
          </div>
        )}
      </div>

      {/* Month + sort + active filters */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-2">
          <MonthSelector value={filters.month} onChange={setMonth} />
          <div className="flex items-center gap-2">
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition"
              >
                {t('tx_filter_reset')}
              </button>
            )}
            <button
              onClick={toggleSortOrder}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                filters.sortOrder === 'asc'
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={filters.sortOrder === 'desc' ? t('tx_sort_recent') : t('tx_sort_oldest')}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {filters.sortOrder === 'desc' ? t('tx_sort_recent') : t('tx_sort_oldest')}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-4 pb-3 space-y-2.5">
            {/* Type filter */}
            <div className="flex gap-2">
              {(['지출', '수입'] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setType(filters.type === type ? null : type)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    filters.type === type
                      ? type === '지출'
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {type === '지출' ? t('form_expense') : t('form_income')}
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
            title={t('tx_empty_title')}
            description={
              prevMonthRows?.length
                ? `${tr.tx_empty_last_month(prevMonthRows.map(r => formatCurrency(r.amount, r.currency)).join(' + '))}. ${t('tx_empty_no_history')}`
                : t('tx_empty_no_history')
            }
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
        title={t('tx_delete_title')}
        description={t('tx_delete_desc')}
        confirmLabel={t('tx_delete')}
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
  const t = useT()

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
            {t('tx_edit')}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('tx_delete')}
          </button>
        </div>
      )}
    </div>
  )
}
