import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useAnalytics } from '@/lib/hooks/useDashboard'
import { useUIStore } from '@/lib/stores/ui.store'
import { MonthSelector } from '@/components/ui/MonthSelector'
import { PageHeader } from '@/components/ui/PageHeader'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, getMonthLabel } from '@/utils/format'

export default function Analytics() {
  const { selectedMonth, setSelectedMonth } = useUIStore()
  const { data: months, isLoading } = useAnalytics(selectedMonth)

  const current = months?.at(-1)
  const previous = months?.at(-2)

  const expenseDiff = current && previous && previous.expense > 0
    ? ((current.expense - previous.expense) / previous.expense) * 100
    : null

  const categoryMap: Record<string, { name: string; color: string; amount: number }> = {}
  current?.rows.filter((r) => r.type === '지출').forEach((r) => {
    const cat = r.categories as { name: string; color: string } | null
    if (!cat || !r.category_id) return
    if (!categoryMap[r.category_id]) categoryMap[r.category_id] = { name: cat.name, color: cat.color, amount: 0 }
    categoryMap[r.category_id].amount += r.amount
  })
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div>
      <PageHeader
        title="월별 분석"
        action={<MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
      />

      <div className="p-4 space-y-4">
        {/* 전월 대비 */}
        {!isLoading && expenseDiff !== null && (
          <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
            {expenseDiff >= 0
              ? <TrendingUp className="h-5 w-5 text-red-500" />
              : <TrendingDown className="h-5 w-5 text-blue-500" />
            }
            <span className="text-sm text-gray-600 dark:text-gray-400">전월 대비</span>
            <span className={`ml-auto text-sm font-bold ${expenseDiff >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(1)}%
            </span>
          </div>
        )}

        {/* 월별 지출 추이 바 차트 */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">최근 6개월 지출 추이</h2>
          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={200} minWidth={320}>
                <BarChart data={months?.map((m) => ({ name: getMonthLabel(m.month).replace('년 ', '/').replace('월', ''), 지출: m.expense, 수입: m.income }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v as number)} />
                  <Bar dataKey="지출" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="수입" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 카테고리 파이 차트 */}
        {!isLoading && categoryBreakdown.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">카테고리별 지출</h2>
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="amount" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {i < 3 ? `TOP ${i + 1} ` : ''}{cat.name}
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(cat.amount / categoryBreakdown[0].amount) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
