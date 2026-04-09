import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  back?: boolean
}

export function PageHeader({ title, subtitle, action, back }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-3 z-20 mx-4 mt-3 mb-4 flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="tap-target flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-500 transition hover:bg-slate-200/70 active:scale-95 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/80"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          {subtitle && <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{subtitle}</p>}
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
