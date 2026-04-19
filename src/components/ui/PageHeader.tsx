import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Settings } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  back?: boolean
  backTo?: string
  showSettings?: boolean
}

export function PageHeader({ title, subtitle, action, back, backTo, showSettings = true }: PageHeaderProps) {
  const navigate = useNavigate()
  const t = useT()

  return (
    <header className="sticky top-3 z-20 mx-4 mt-3 mb-4 flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => {
              if (backTo) navigate(backTo)
              else navigate(-1)
            }}
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
      <div className="flex shrink-0 items-center gap-2">
        {action && <div>{action}</div>}
        {showSettings && (
          <button
            onClick={() => navigate('/settings')}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-500 transition hover:bg-slate-200/70 hover:text-[#0d8a7a] active:scale-95 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/80"
            aria-label={t('nav_settings')}
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  )
}
