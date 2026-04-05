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
    <header className="flex items-center justify-between px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h1>
        </div>
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}
