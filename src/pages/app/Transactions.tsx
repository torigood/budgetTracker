import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, List, Edit2, Trash2, ArrowUpDown, ChevronLeft, Plus, Settings, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useTransactions, useDeleteTransaction } from '@/lib/hooks/useTransactions'
import { useCategories } from '@/lib/hooks/useCategories'
import { useFilterStore } from '@/lib/stores/filter.store'
import { useSwipeMonth } from '@/lib/hooks/useSwipeMonth'
import { TransactionSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CategoryBadge } from '@/components/ui/Badge'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDateShort, getRelativeDate, getMonthRange } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { useT } from '@/lib/hooks/useT'
import { useUIStore } from '@/lib/stores/ui.store'
import { useExchangeRates } from '@/lib/hooks/useExchangeRates'
import { convertAmount } from '@/lib/utils/currency'
import { ConvertedAmount } from '@/components/ui/ConvertedAmount'
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
  memo: string | null
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
  const { lang, currency: defaultCurrency } = useUIStore()
  const tr = translations[lang]
  const { filters, setMonth, setCategoryId, setType, setSearch, toggleSortOrder, resetFilters } = useFilterStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchAll, setSearchAll] = useState(false)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [detailTx, setDetailTx] = useState<TxWithCategory | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useTransactions(filters, searchAll && !!filters.search)
  const { data: categories } = useCategories()
  const deleteMutation = useDeleteTransaction()
  const swipe = useSwipeMonth(filters.month, setMonth)
  const { data: ratesData } = useExchangeRates(defaultCurrency)

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
    <div className="flex min-h-full flex-col pb-6" {...swipe}>
      <header className="px-5 pb-2 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="홈으로"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[2.05rem] leading-[1.05] font-semibold tracking-tight text-slate-950 dark:text-white">
              {t('tx_title')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/transactions/new')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0d8a7a] text-white shadow-sm transition hover:bg-[#0a7568]"
              aria-label="거래 추가"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400 transition hover:bg-slate-100 hover:text-[#0d8a7a] dark:hover:bg-slate-800"
              aria-label={t('nav_settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Search + filter bar */}
      <div className="mx-4 mt-2 rounded-[1.75rem] border border-slate-200/90 bg-white px-4 pt-4 pb-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('tx_search')}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-3 text-base text-slate-900 outline-none transition placeholder-slate-400 focus:border-[#0d8a7a]/40 focus:bg-white focus:ring-4 focus:ring-[#0d8a7a]/10 dark:bg-slate-800/80 dark:text-white dark:focus:bg-slate-800"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
          className={`tap-target flex h-12 w-12 items-center justify-center rounded-2xl transition active:scale-95 ${
            showFilters || hasActiveFilter
              ? 'bg-[#0d8a7a] text-white shadow-lg shadow-[#0d8a7a]/20'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
          }`}
          aria-label={t('tx_filter_reset')}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        </div>
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => setType(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              !filters.type ? 'bg-[#0d8a7a] text-white' : 'bg-[#dbefeb] text-[#0d8a7a]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setType('수입')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filters.type === '수입' ? 'bg-[#0d8a7a] text-white' : 'bg-[#dbefeb] text-[#0d8a7a]'
            }`}
          >
            {t('form_income')}
          </button>
          <button
            onClick={() => setType('지출')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filters.type === '지출' ? 'bg-[#0d8a7a] text-white' : 'bg-[#dbefeb] text-[#0d8a7a]'
            }`}
          >
            {t('form_expense')}
          </button>
        </div>
        {/* 전체 기간 검색 토글 — 검색어 있을 때만 표시 */}
        {filters.search && (
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => setSearchAll(false)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                !searchAll ? 'bg-[#0d8a7a] text-white shadow-sm' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {t('tx_search_month')}
            </button>
            <button
              onClick={() => setSearchAll(true)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                searchAll ? 'bg-[#0d8a7a] text-white shadow-sm' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {t('tx_search_all')}
            </button>
          </div>
        )}
      </div>

      {/* Month + sort + active filters */}
      <div className="mx-4 mt-3 rounded-[1.75rem] border border-slate-200/90 bg-white px-4 py-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-3">
          <MonthSelector value={filters.month} onChange={setMonth} />
          <button
            onClick={toggleSortOrder}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filters.sortOrder === 'asc'
                ? 'bg-[#dbefeb] text-[#0d8a7a]'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
            title={filters.sortOrder === 'desc' ? t('tx_sort_recent') : t('tx_sort_oldest')}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {filters.sortOrder === 'desc' ? t('tx_sort_recent') : t('tx_sort_oldest')}
          </button>
        </div>

        {hasActiveFilter && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={resetFilters}
              className="whitespace-nowrap rounded-full bg-[#dbefeb] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-[#0d8a7a] transition"
            >
              {t('tx_filter_reset')}
            </button>
          </div>
        )}

        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Type filter */}
            <div className="hidden gap-2">
              {(['지출', '수입'] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setType(filters.type === type ? null : type)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    filters.type === type
                      ? type === '지출'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {type === '지출' ? t('form_expense') : t('form_income')}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div
              className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
              data-swipe-month-ignore="true"
            >
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(filters.categoryId === cat.id ? null : cat.id)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    filters.categoryId === cat.id ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
          <div className="mx-4 mt-3 card divide-y divide-slate-50/80 overflow-hidden rounded-3xl dark:divide-slate-800/70">
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
            const dayExpenseConverted = ratesData?.rates
              ? txs
                .filter(t => t.type === '지출')
                .reduce((sum, t) => {
                  const converted = convertAmount(t.amount, t.currency, defaultCurrency, ratesData.rates, ratesData.base)
                  return sum + (converted ?? 0)
                }, 0)
              : null
            const dayExpenseDisplay = dayExpenseConverted ?? dayExpense
            return (
              <div key={dateLabel} className="mt-3 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80">
                {/* Date group header */}
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{dateLabel}</span>
                  {dayExpenseDisplay > 0 && (
                    <span className="text-xs font-semibold text-rose-400 tabular-nums">
                      -{formatCurrency(dayExpenseDisplay, defaultCurrency)}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-50/80 dark:divide-slate-800/60">
                  {txs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      showActions={activeActionId === tx.id}
                      onToggleActions={() => setActiveActionId((prev) => (prev === tx.id ? null : tx.id))}
                      onEdit={() => {
                        setActiveActionId(null)
                        navigate(`/transactions/${tx.id}/edit`)
                      }}
                      onView={() => {
                        setActiveActionId(null)
                        setDetailTx(tx)
                      }}
                      onDelete={() => {
                        setActiveActionId(null)
                        setDeleteId(tx.id)
                      }}
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

      {detailTx && (
        <TransactionDetailModal tx={detailTx} onClose={() => setDetailTx(null)} />
      )}
    </div>
  )
}

function TransactionRow({
  tx,
  showActions,
  onToggleActions,
  onEdit,
  onView,
  onDelete,
}: {
  tx: TxWithCategory
  showActions: boolean
  onToggleActions: () => void
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}) {
  const t = useT()

  return (
    <div
      className="relative flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors active:bg-slate-100/70 dark:active:bg-slate-800/50"
      onClick={onToggleActions}
    >
      {/* Category avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm"
        style={{
          backgroundColor: `${tx.categories?.color ?? '#94a3b8'}15`,
          color: tx.categories?.color ?? '#94a3b8',
        }}
      >
        {(() => {
          const rawIcon = tx.categories?.icon?.trim() ?? ''
          return rawIcon && !/^[a-z0-9_-]+$/i.test(rawIcon) ? rawIcon : (tx.categories?.name?.[0] ?? '?')
        })()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex min-w-0 items-start gap-1.5">
          <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold text-slate-900 dark:text-white">
            {tx.description}
          </span>
          {tx.categories && (
            <CategoryBadge color={tx.categories.color} label={tx.categories.name} icon={tx.categories.icon} size="sm" />
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{tx.payment_method}</p>
      </div>

      <div className="shrink-0 text-right">
        <span
          className={`block text-sm font-semibold tabular-nums ${
            tx.type === '지출' ? 'text-rose-500' : 'text-emerald-500'
          }`}
        >
          {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
        </span>
        <ConvertedAmount amount={tx.amount} fromCurrency={tx.currency} className="mt-0.5 block" />
      </div>

      {/* Inline action buttons — appear on tap, positioned to the right */}
      <div
        className={`absolute right-3 top-1/2 z-10 flex origin-right -translate-y-1/2 gap-1 rounded-2xl border border-white/70 bg-white/95 p-1 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-all duration-150 dark:border-slate-700/70 dark:bg-slate-900/95 ${
          showActions ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onView}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Eye className="h-3.5 w-3.5" />
          {t('tx_view')}
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#0d8a7a] transition hover:bg-[#dbefeb]"
        >
          <Edit2 className="h-3.5 w-3.5" />
          {t('tx_edit')}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('tx_delete')}
        </button>
      </div>
    </div>
  )
}

function TransactionDetailModal({
  tx,
  onClose,
}: {
  tx: TxWithCategory
  onClose: () => void
}) {
  const t = useT()

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 pt-8 pb-24 sm:pb-8" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs text-slate-400">{formatDateShort(tx.date)}</p>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{t('tx_detail_title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t('cancel')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('form_amount')}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${tx.type === '지출' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {tx.type === '지출' ? '-' : '+'}
              {formatCurrency(tx.amount, tx.currency)}
            </p>
            <ConvertedAmount amount={tx.amount} fromCurrency={tx.currency} className="mt-1 block" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <DetailField label={t('form_date')} value={formatDateShort(tx.date)} />
            <DetailField label={t('form_description')} value={tx.description || '-'} />
            <DetailField label={t('form_category')} value={tx.categories?.name ?? '-'} />
            <DetailField label={t('form_payment')} value={tx.payment_method || '-'} />
            <DetailField label={t('tx_receipt_items')} value={tx.memo?.trim() || '-'} multiline />
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailField({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-100 px-4 py-3 dark:border-slate-800">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-sm text-slate-900 dark:text-slate-100 ${multiline ? 'whitespace-pre-wrap break-words' : ''}`}>
        {value}
      </p>
    </div>
  )
}
