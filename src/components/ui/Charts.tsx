import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const FINTRA_CHART_COLORS = ['#0b6f61', '#c9ddd2', '#ec8b83', '#d89455', '#eee5d8', '#8aa79a']
const GRID_COLOR = '#edf1ef'
const TICK_COLOR = '#96a0a0'

type TooltipFormatter = (value: number) => string

export type DonutDatum = {
  id: string
  name: string
  amount: number
  color?: string
}

export type MonthlyBarDatum = {
  label: string
  expense: number
  income?: number
}

export type SpendingTrendDatum = {
  label: string
  value: number
}

export type BudgetProgressDatum = {
  id: string
  label: string
  value: number
  limit: number
  tone?: 'emerald' | 'sage' | 'orange' | 'coral' | 'neutral'
}

interface DonutChartProps {
  data: DonutDatum[]
  totalLabel?: string
  formatValue: TooltipFormatter
}

interface MonthlyBarChartProps {
  data: MonthlyBarDatum[]
  formatValue: TooltipFormatter
  showIncome?: boolean
}

interface SpendingTrendLineGraphProps {
  data: SpendingTrendDatum[]
  formatValue: TooltipFormatter
}

interface BudgetProgressBarsProps {
  data: BudgetProgressDatum[]
  formatValue?: TooltipFormatter
}

const progressTone: Record<NonNullable<BudgetProgressDatum['tone']>, string> = {
  emerald: '#0b6f61',
  sage: '#8aa79a',
  orange: '#d89455',
  coral: '#ec8b83',
  neutral: '#5f6868',
}

const tooltipStyle = {
  borderRadius: '18px',
  border: '1px solid var(--fintra-line-strong)',
  boxShadow: '0 18px 44px rgba(35, 43, 43, 0.12)',
  backgroundColor: 'var(--fintra-surface)',
  color: 'var(--fintra-charcoal)',
  fontSize: '12px',
}

export function DonutChart({ data, totalLabel, formatValue }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[118px] w-[118px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={56}
              paddingAngle={2}
              cornerRadius={8}
              stroke="#ffffff"
              strokeWidth={4}
              animationDuration={420}
            >
              {data.map((entry, index) => (
                <Cell key={entry.id} fill={entry.color ?? FINTRA_CHART_COLORS[index % FINTRA_CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatValue(Number(value))} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fintra-ink-3)]">{totalLabel}</span>
          <span className="mt-0.5 text-[12px] font-bold tabular-nums text-[var(--fintra-charcoal)]">{formatValue(total)}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        {data.map((item, index) => {
          const color = item.color ?? FINTRA_CHART_COLORS[index % FINTRA_CHART_COLORS.length]
          const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0
          return (
            <div key={item.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="truncate text-xs font-semibold text-[var(--fintra-ink-2)]">{item.name}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--fintra-charcoal)]">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#edf1ef]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MonthlyBarChart({ data, formatValue, showIncome = true }: MonthlyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={208} minWidth={300}>
      <BarChart data={data} barCategoryGap="34%" barGap={4} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeWidth={1} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: TICK_COLOR }}
          tickFormatter={(value) => formatValue(Number(value))}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip formatter={(value) => formatValue(Number(value))} cursor={{ fill: 'rgba(201, 221, 210, 0.18)' }} contentStyle={tooltipStyle} />
        <Bar dataKey="expense" fill="#ec8b83" radius={[9, 9, 9, 9]} animationDuration={420} />
        {showIncome && <Bar dataKey="income" fill="#0b6f61" radius={[9, 9, 9, 9]} animationDuration={420} />}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SpendingTrendLineGraph({ data, formatValue }: SpendingTrendLineGraphProps) {
  return (
    <ResponsiveContainer width="100%" height={178} minWidth={300}>
      <AreaChart data={data} margin={{ top: 8, right: 2, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="fintraTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0b6f61" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0b6f61" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_COLOR} strokeWidth={1} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: TICK_COLOR }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: TICK_COLOR }}
          tickFormatter={(value) => formatValue(Number(value))}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip formatter={(value) => formatValue(Number(value))} contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#0b6f61"
          strokeWidth={2.5}
          fill="url(#fintraTrendFill)"
          dot={{ r: 3, strokeWidth: 2, stroke: '#ffffff', fill: '#0b6f61' }}
          activeDot={{ r: 5, strokeWidth: 3, stroke: '#ffffff', fill: '#0b6f61' }}
          animationDuration={420}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BudgetProgressBars({ data, formatValue }: BudgetProgressBarsProps) {
  return (
    <div className="space-y-3">
      {data.map((item) => {
        const pct = item.limit > 0 ? Math.min(Math.round((item.value / item.limit) * 100), 100) : 0
        const color = progressTone[item.tone ?? 'emerald']
        return (
          <div key={item.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="truncate text-xs font-semibold text-[var(--fintra-ink-2)]">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--fintra-charcoal)]">
                {formatValue ? `${formatValue(item.value)} · ${pct}%` : `${pct}%`}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#edf1ef]">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

