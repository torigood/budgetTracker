import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, List, Trash2, ArrowUpDown, ChevronLeft, Plus, Settings, Edit2, X, Tag, Store, CreditCard, CalendarClock, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useTransactions, useDeleteTransaction, useUpdateTransaction } from '@/lib/hooks/useTransactions'
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
import { Card } from '@/components/ui/Card'
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
  created_at?: string
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
    <div className="flex min-h-full flex-col pb-8" {...swipe}>
      <header className="fintra-page-header">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="fintra-icon-button mt-0.5 h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-2xl shadow-[var(--fintra-shadow-soft)] dark:hover:bg-slate-800"
              aria-label="홈으로"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="fintra-kicker">{lang === 'ko' ? '내역' : 'History'}</p>
              <h1 className="fintra-page-title mt-1 truncate dark:text-white">
                {t('tx_title')}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => navigate('/transactions/new')}
              className="flex h-10 min-h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0b6f61] text-white shadow-[0_12px_24px_rgba(11,111,97,0.2)] transition hover:bg-[#063f39]"
              aria-label="거래 추가"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="fintra-icon-button h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-2xl hover:text-[#0b6f61] dark:hover:bg-slate-800"
              aria-label={t('nav_settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Search + filter bar */}
      <Card variant="settings" padding="md" className="mx-4 mt-2">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('tx_search')}
              className="w-full rounded-[1.35rem] border border-transparent bg-[#f5f6f8] py-3.5 pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-[#0b6f61]/10 dark:bg-slate-800/80 dark:text-white dark:focus:bg-slate-800"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
          className={`tap-target flex h-12 w-12 items-center justify-center rounded-[1.35rem] transition active:scale-95 ${
            showFilters || hasActiveFilter
              ? 'bg-[#0b6f61] text-white shadow-[0_10px_22px_rgba(11,111,97,0.16)]'
              : 'bg-[#f5f6f8] text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
          }`}
          aria-label={t('tx_filter_reset')}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-[1.35rem] bg-[#f5f6f8] p-1">
          <button
            onClick={() => setType(null)}
            className={`min-h-10 rounded-[1rem] px-3 text-sm font-semibold transition ${
              !filters.type ? 'bg-white text-[#0b6f61] shadow-[var(--fintra-shadow-soft)]' : 'text-[var(--fintra-ink-2)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setType('수입')}
            className={`min-h-10 rounded-[1rem] px-3 text-sm font-semibold transition ${
              filters.type === '수입' ? 'bg-white text-[#0b6f61] shadow-[var(--fintra-shadow-soft)]' : 'text-[var(--fintra-ink-2)]'
            }`}
          >
            {t('form_income')}
          </button>
          <button
            onClick={() => setType('지출')}
            className={`min-h-10 rounded-[1rem] px-3 text-sm font-semibold transition ${
              filters.type === '지출' ? 'bg-white text-[#c46f63] shadow-[var(--fintra-shadow-soft)]' : 'text-[var(--fintra-ink-2)]'
            }`}
          >
            {t('form_expense')}
          </button>
        </div>
        {/* 전체 기간 검색 토글 — 검색어 있을 때만 표시 */}
        {filters.search && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setSearchAll(false)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                !searchAll ? 'bg-[#0b6f61] text-white shadow-sm' : 'bg-[#f5f6f8] text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {t('tx_search_month')}
            </button>
            <button
              onClick={() => setSearchAll(true)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                searchAll ? 'bg-[#0b6f61] text-white shadow-sm' : 'bg-[#f5f6f8] text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {t('tx_search_all')}
            </button>
          </div>
        )}
        {categories?.length ? (
          <div className="-mx-1 mt-3 fintra-horizontal-scroll px-1 pb-1" data-swipe-month-ignore="true">
            <div className="flex w-max min-w-full gap-2">
              {categories.slice(0, showFilters ? categories.length : 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(filters.categoryId === cat.id ? null : cat.id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                  filters.categoryId === cat.id ? 'text-white shadow-sm' : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
                style={filters.categoryId === cat.id
                  ? { backgroundColor: cat.color, borderColor: `${cat.color}44` }
                  : { borderColor: `${cat.color}22`, backgroundColor: `${cat.color}10`, color: cat.color }}
              >
                {cat.name}
              </button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Month + sort + active filters */}
      <Card variant="soft" padding="sm" className="mx-4 mt-3">
        <div className="flex items-center justify-between gap-3">
          <MonthSelector value={filters.month} onChange={setMonth} />
          <button
            onClick={toggleSortOrder}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filters.sortOrder === 'asc'
                ? 'bg-[#dceee9] text-[#0b6f61]'
                : 'bg-white text-slate-500 shadow-[var(--fintra-shadow-soft)] hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
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
              className="whitespace-nowrap rounded-full bg-[#dceee9] px-2.5 py-1.5 text-[11px] font-semibold leading-none text-[#0b6f61] transition"
            >
              {t('tx_filter_reset')}
            </button>
          </div>
        )}

      </Card>

      {/* List */}
      <div className="flex-1">
        {isLoading ? (
          <Card variant="transaction" padding="none" className="mx-4 mt-3 divide-y divide-slate-50/80 overflow-hidden dark:divide-slate-800/70">
            {Array.from({ length: 8 }).map((_, i) => <TransactionSkeleton key={i} />)}
          </Card>
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
              <Card key={dateLabel} variant="transaction" padding="none" className="mx-4 mt-3 overflow-hidden">
                {/* Date group header */}
                <div className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{dateLabel}</span>
                  {dayExpenseDisplay > 0 && (
                    <span className="rounded-full bg-[#f8e8e4] px-2.5 py-1 text-xs font-semibold text-[#c46f63] tabular-nums">
                      -{formatCurrency(dayExpenseDisplay, defaultCurrency)}
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-50/80 dark:divide-slate-800/60">
                  {txs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onView={() => setDetailTx(tx)}
                    />
                  ))}
                </div>
              </Card>
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
        <TransactionDetailModal
          tx={detailTx}
          onClose={() => setDetailTx(null)}
          onEdit={() => {
            const id = detailTx.id
            setDetailTx(null)
            navigate(`/transactions/${id}/edit`)
          }}
          onDelete={() => {
            setDeleteId(detailTx.id)
            setDetailTx(null)
          }}
        />
      )}
    </div>
  )
}

function TransactionRow({
  tx,
  onView,
}: {
  tx: TxWithCategory
  onView: () => void
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors active:bg-slate-100/70 dark:active:bg-slate-800/50"
      onClick={onView}
    >
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

      <div className="min-w-0 flex-1">
        <p className="min-w-0 truncate text-[0.92rem] font-semibold text-[var(--fintra-charcoal)] dark:text-white">
          {tx.description}
        </p>
        <div className="mt-1.5 flex min-w-0 items-center gap-2">
          {tx.categories && (
            <CategoryBadge color={tx.categories.color} label={tx.categories.name} icon={tx.categories.icon} size="sm" />
          )}
          <span className="min-w-0 truncate text-xs text-slate-400">{tx.payment_method}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span
          className={`block text-[0.92rem] font-semibold tabular-nums ${
            tx.type === '지출' ? 'text-[#c46f63]' : 'text-[#0b6f61]'
          }`}
        >
          {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
        </span>
        <ConvertedAmount amount={tx.amount} fromCurrency={tx.currency} className="mt-0.5 block" />
      </div>
    </div>
  )
}

function TransactionDetailModal({
  tx,
  onClose,
  onEdit,
  onDelete,
}: {
  tx: TxWithCategory
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useT()
  const { lang } = useUIStore()
  const updateMutation = useUpdateTransaction()
  const [notes, setNotes] = useState(tx.memo ?? '')
  const isExpense = tx.type === '지출'
  const notesChanged = notes !== (tx.memo ?? '')
  const dateTime = (() => {
    const date = formatDateShort(tx.date)
    if (!tx.created_at) return lang === 'ko' ? `${date} · 시간 정보 없음` : `${date} · No time saved`
    return `${date} · ${new Date(tx.created_at).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  })()

  async function handleSaveNotes() {
    try {
      await updateMutation.mutateAsync({ id: tx.id, data: { memo: notes.trim() || null } })
      toast.success(lang === 'ko' ? '메모가 저장됐습니다' : 'Notes saved')
    } catch {
      toast.error(t('form_save_fail'))
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-8 sm:items-center sm:pb-8" onClick={onClose}>
      <div className="absolute inset-0 bg-[#141716]/35 backdrop-blur-sm" />

      <div
        className="relative z-10 flex max-h-[88svh] w-full max-w-[430px] flex-col overflow-hidden rounded-[2.25rem] border border-white/80 bg-[#fbfbfa] shadow-[0_28px_80px_rgba(20,23,22,0.22)] dark:border-slate-800/70 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden px-5 pb-5 pt-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,#f2e4d4_0%,rgba(251,251,250,0)_100%)]" />
          <div className="relative flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#7d8582] shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
              aria-label={t('cancel')}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-[#006b5b] shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-800"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t('tx_edit')}
              </button>
              <button
                onClick={onDelete}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#c46f63] shadow-[var(--fintra-shadow-soft)] transition active:scale-95 dark:bg-slate-800"
                aria-label={t('tx_delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative mt-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b9390]">
              {isExpense ? t('form_expense') : t('form_income')}
            </p>
            <p className={`mt-2 text-[2.55rem] font-semibold leading-none tracking-[-0.01em] tabular-nums ${isExpense ? 'text-[#c46f63]' : 'text-[#006b5b]'}`}>
              {tx.type === '지출' ? '-' : '+'}
              {formatCurrency(tx.amount, tx.currency)}
            </p>
            <ConvertedAmount amount={tx.amount} fromCurrency={tx.currency} className="mt-2 block text-[11px]" />
            <div className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-[#141716] shadow-[var(--fintra-shadow-soft)] dark:bg-slate-800 dark:text-white">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{
                  backgroundColor: `${tx.categories?.color ?? '#8aa79a'}18`,
                  color: tx.categories?.color ?? '#006b5b',
                }}
              >
                {tx.categories?.icon || tx.categories?.name?.[0] || '·'}
              </span>
              <span className="truncate">{tx.description || (lang === 'ko' ? '거래' : 'Transaction')}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="grid grid-cols-2 gap-3">
            <DetailInfoCard
              icon={<Tag className="h-4 w-4" />}
              label={t('form_category')}
              value={tx.categories?.name ?? '-'}
              color={tx.categories?.color ?? '#006b5b'}
            />
            <DetailInfoCard
              icon={<CreditCard className="h-4 w-4" />}
              label={t('form_payment')}
              value={tx.payment_method || '-'}
              color="#9a6b37"
            />
          </div>

          <div className="rounded-[1.55rem] border border-[var(--fintra-line)] bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-800 dark:bg-slate-900/70">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8b9390]">
              {lang === 'ko' ? '거래 정보' : 'Transaction info'}
            </p>
            <div className="space-y-3">
              <DetailRow icon={<Store className="h-4 w-4" />} label={lang === 'ko' ? '가맹점' : 'Merchant'} value={tx.description || '-'} />
              <DetailRow icon={<CalendarClock className="h-4 w-4" />} label={t('form_date')} value={dateTime} />
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-[var(--fintra-line)] bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f1e8] text-[#006b5b]">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#141716] dark:text-white">{t('form_memo')}</p>
                  <p className="text-[11px] font-medium text-[#8b9390]">
                    {lang === 'ko' ? '필요할 때 바로 수정할 수 있어요' : 'Editable whenever you need'}
                  </p>
                </div>
              </div>
              {notesChanged && (
                <button
                  onClick={handleSaveNotes}
                  disabled={updateMutation.isPending}
                  className="rounded-full bg-[#006b5b] px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-60"
                >
                  {updateMutation.isPending ? '...' : t('save')}
                </button>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('form_memo_placeholder')}
              rows={4}
              className="w-full resize-none rounded-[1.2rem] border border-transparent bg-[#f5f6f8] px-4 py-3 text-sm font-medium leading-6 text-[#141716] outline-none transition placeholder:text-[#a3aaa7] focus:bg-white focus:ring-4 focus:ring-[#006b5b]/10 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailInfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="min-w-0 rounded-[1.55rem] border border-[var(--fintra-line)] bg-white p-4 shadow-[var(--fintra-shadow-soft)] dark:border-slate-800 dark:bg-slate-900/70">
      <span
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}16`, color }}
      >
        {icon}
      </span>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9390]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#141716] dark:text-white">{value}</p>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f6f3] text-[#006b5b] dark:bg-slate-800">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9390]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[#141716] dark:text-white">{value}</p>
      </div>
    </div>
  )
}
