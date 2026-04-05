import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
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
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <span className="text-lg font-bold text-gray-900 dark:text-white">💰 가계부</span>
        <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
      </header>

      <div className="p-4 space-y-4">
        {/* 요약 카드 3개 */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="지출" amount={data?.totalExpense ?? 0} color="text-red-500" icon={<TrendingDown className="h-4 w-4" />} />
            <SummaryCard label="수입" amount={data?.totalIncome ?? 0} color="text-blue-500" icon={<TrendingUp className="h-4 w-4" />} />
            <SummaryCard label="순손익" amount={data?.netBalance ?? 0} color={(data?.netBalance ?? 0) >= 0 ? 'text-blue-500' : 'text-red-500'} icon={<Minus className="h-4 w-4" />} />
          </div>
        )}

        {/* 카테고리 도넛 차트 */}
        {!isLoading && data && data.categoryBreakdown.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">카테고리별 지출</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={data.categoryBreakdown} dataKey="amount" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                    {data.categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {data.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2">
                    <CategoryBadge color={cat.color} label={cat.name} size="sm" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 tabular-nums shrink-0">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 최근 거래 */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">최근 거래</h2>
            <button onClick={() => navigate('/transactions')} className="text-xs text-blue-500">전체보기</button>
          </div>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <TransactionSkeleton key={i} />)
          ) : !data?.recentTransactions.length ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">거래 내역이 없습니다</p>
          ) : (
            data.recentTransactions.map((tx) => {
              const cat = tx.categories as { name: string; color: string } | null
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 active:bg-gray-50 dark:active:bg-gray-800"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${cat?.color ?? '#6b7280'}20` }}
                  >
                    <span className="text-sm font-bold" style={{ color: cat?.color ?? '#6b7280' }}>
                      {cat?.name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDateShort(tx.date)}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.type === '지출' ? 'text-red-500' : 'text-blue-500'}`}>
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

function SummaryCard({ label, amount, color, icon }: { label: string; amount: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 p-3 shadow-sm">
      <div className={`flex items-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-base font-bold tabular-nums ${color}`}>
        {formatCurrency(Math.abs(amount))}
      </p>
    </div>
  )
}
