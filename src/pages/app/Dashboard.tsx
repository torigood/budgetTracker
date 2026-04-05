import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, ArrowRight, Plus } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useDashboard } from '@/lib/hooks/useDashboard'
import { useUIStore } from '@/lib/stores/ui.store'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { CardSkeleton, TransactionSkeleton } from '@/components/ui/Skeleton'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDateShort } from '@/utils/format'

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedMonth, setSelectedMonth } = useUIStore()
  const { data, isLoading } = useDashboard(selectedMonth)

  return (
    <div className="pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-400 font-medium">대시보드</p>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">가계부</h1>
        </div>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </header>

      <div className="p-4 space-y-4">
        {/* 요약 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label="지출"
              amount={data?.totalExpense ?? 0}
              type="expense"
              icon={<TrendingDown className="h-3.5 w-3.5" />}
            />
            <SummaryCard
              label="수입"
              amount={data?.totalIncome ?? 0}
              type="income"
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
            <SummaryCard
              label="순손익"
              amount={data?.netBalance ?? 0}
              type={(data?.netBalance ?? 0) >= 0 ? 'income' : 'expense'}
              icon={<Minus className="h-3.5 w-3.5" />}
            />
          </div>
        )}

        {/* 빠른 추가 버튼 */}
        <button
          onClick={() => navigate('/transactions/new')}
          className="flex w-full items-center justify-between rounded-2xl bg-indigo-500 px-5 py-4 text-white shadow-md shadow-indigo-500/25 active:scale-[0.98] transition"
        >
          <div>
            <p className="text-xs font-medium text-indigo-200">새 거래 추가</p>
            <p className="text-sm font-semibold">수입 또는 지출을 기록하세요</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Plus className="h-5 w-5" />
          </span>
        </button>

        {/* 카테고리 도넛 차트 */}
        {!isLoading && data && data.categoryBreakdown.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">카테고리별 지출</h2>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="amount"
                      cx="50%"
                      cy="50%"
                      innerRadius={33}
                      outerRadius={52}
                      strokeWidth={2}
                      stroke="transparent"
                    >
                      {data.categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrency(v as number)}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {data.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2">
                    <CategoryBadge color={cat.color} label={cat.name} size="sm" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 최근 거래 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">최근 거래</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              전체보기 <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
          ) : !data?.recentTransactions.length ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-slate-400">거래 내역이 없습니다</p>
              <button
                onClick={() => navigate('/transactions/new')}
                className="mt-2 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                첫 거래 추가하기 →
              </button>
            </div>
          ) : (
            data.recentTransactions.map((tx) => {
              const cat = tx.categories as { name: string; color: string } | null
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 last:border-0 active:bg-slate-50 dark:active:bg-slate-800/40 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${cat?.color ?? '#6b7280'}18`,
                      color: cat?.color ?? '#6b7280',
                    }}
                  >
                    {cat?.name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-slate-400">{formatDateShort(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    tx.type === '지출' ? 'text-rose-500' : 'text-emerald-500'
                  }`}>
                    {tx.type === '지출' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

type SummaryType = 'income' | 'expense' | 'neutral'

function SummaryCard({
  label,
  amount,
  type,
  icon,
}: {
  label: string
  amount: number
  type: SummaryType
  icon: React.ReactNode
}) {
  const styles: Record<SummaryType, { bg: string; icon: string; amount: string }> = {
    expense: {
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      icon: 'text-rose-500 bg-rose-100 dark:bg-rose-800/40',
      amount: 'text-rose-600 dark:text-rose-400',
    },
    income: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-800/40',
      amount: 'text-emerald-600 dark:text-emerald-400',
    },
    neutral: {
      bg: 'bg-slate-50 dark:bg-slate-800',
      icon: 'text-slate-500 bg-slate-100 dark:bg-slate-700',
      amount: 'text-slate-700 dark:text-slate-300',
    },
  }

  const s = styles[type]

  return (
    <div className={`rounded-2xl p-3 ${s.bg}`}>
      <div className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-lg ${s.icon}`}>
        {icon}
      </div>
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold tabular-nums leading-tight ${s.amount}`}>
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  )
}
