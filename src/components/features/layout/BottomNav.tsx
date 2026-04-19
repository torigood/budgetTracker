import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, List, Camera, BarChart2, Target } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const isTransactionActive = location.pathname.startsWith('/transactions')

  function go(to: string) {
    navigate(to)
  }

  const isHome = location.pathname.startsWith('/dashboard')
  const isBudget = location.pathname.startsWith('/settings/budget')
  const isAnalytics = location.pathname.startsWith('/analytics')
  const isReceipt = location.pathname.startsWith('/receipt')

  return (
    <nav
      className="mobile-bottom-nav absolute inset-x-0 bottom-0 z-50 transition-all duration-200"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="w-full border-t border-slate-200/80 bg-white/95 px-2 pt-2 shadow-[0_-8px_22px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/93"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.15rem)' }}
      >
        <div className="relative grid grid-cols-5 items-center gap-0">
          <button
            onClick={() => go('/dashboard')}
            className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 active:scale-95 ${
              isHome ? 'text-[#0d8a7a]' : 'text-slate-400 dark:text-slate-500'
            }`}
            aria-label={t('nav_home')}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="mt-1 text-[11px] font-semibold tracking-tight">{t('nav_home')}</span>
            <span className={`mt-1 h-1 w-1 rounded-full ${isHome ? 'bg-[#0d8a7a]' : 'bg-slate-300 dark:bg-slate-600'}`} />
          </button>

          <div className="relative flex flex-col items-center">
            <button
              onClick={() => go('/transactions')}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 active:scale-95 ${
                isTransactionActive ? 'text-[#0d8a7a]' : 'text-slate-400 dark:text-slate-500'
              }`}
              aria-label={t('nav_transactions')}
            >
              <List className="h-6 w-6" />
              <span className="mt-1 text-[11px] font-semibold tracking-tight">{t('nav_transactions')}</span>
              <span className={`mt-1 h-1 w-1 rounded-full ${isTransactionActive ? 'bg-[#0d8a7a]' : 'bg-slate-300 dark:bg-slate-600'}`} />
            </button>
          </div>

          <button
            onClick={() => go('/receipt')}
            className={`mx-auto -translate-y-1 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md transition-all duration-200 active:scale-95 ${
              isReceipt ? 'bg-[#0a7568]' : 'bg-[#0d8a7a]'
            }`}
            aria-label={t('nav_receipt')}
          >
            <Camera className="h-5 w-5" />
          </button>

          <button
            onClick={() => go('/settings/budget')}
            className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 active:scale-95 ${
              isBudget ? 'text-[#0d8a7a]' : 'text-slate-400 dark:text-slate-500'
            }`}
            aria-label={t('nav_budget')}
          >
            <Target className="h-5 w-5" />
            <span className="mt-1 text-[11px] font-semibold tracking-tight">{t('nav_budget')}</span>
            <span className={`mt-1 h-1 w-1 rounded-full ${isBudget ? 'bg-[#0d8a7a]' : 'bg-slate-300 dark:bg-slate-600'}`} />
          </button>

          <button
            onClick={() => go('/analytics')}
            className={`flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-200 active:scale-95 ${
              isAnalytics ? 'text-[#0d8a7a]' : 'text-slate-400 dark:text-slate-500'
            }`}
            aria-label={t('nav_analytics')}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="mt-1 text-[11px] font-semibold tracking-tight">{t('nav_analytics')}</span>
            <span className={`mt-1 h-1 w-1 rounded-full ${isAnalytics ? 'bg-[#0d8a7a]' : 'bg-slate-300 dark:bg-slate-600'}`} />
          </button>

        </div>
      </div>
    </nav>
  )
}
