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

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 transition-all duration-200 md:absolute"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        className="mx-auto w-full max-w-[430px] border-t border-[#ecefec] bg-white px-4 pt-2 shadow-[0_-10px_28px_rgba(20,23,22,0.045)] dark:border-slate-800 dark:bg-slate-900 md:max-w-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.4rem)' }}
      >
        <div className="relative grid grid-cols-5 items-end gap-1">
          <button
            onClick={() => go('/dashboard')}
            className={`flex min-h-13 min-w-0 flex-col items-center justify-center px-2 py-1.5 transition-all duration-200 active:scale-95 ${
              isHome ? 'text-[#006b5b] dark:text-emerald-400' : 'text-[#141716] dark:text-slate-300'
            }`}
            aria-label={t('nav_home')}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-semibold">{t('nav_home')}</span>
          </button>

          <div className="relative flex flex-col items-center">
            <button
              onClick={() => go('/transactions')}
              className={`flex min-h-13 min-w-0 flex-col items-center justify-center px-2 py-1.5 transition-all duration-200 active:scale-95 ${
                isTransactionActive ? 'text-[#006b5b] dark:text-emerald-400' : 'text-[#141716] dark:text-slate-300'
              }`}
              aria-label={t('nav_transactions')}
            >
              <List className="h-6 w-6" />
              <span className="mt-1 text-[10px] font-semibold">{t('nav_transactions')}</span>
            </button>
          </div>

          <button
            onClick={() => go('/receipt')}
            className="mx-auto -translate-y-2 flex h-13 w-13 items-center justify-center rounded-full bg-[#0b6f61] text-white shadow-[0_14px_26px_rgba(11,111,97,0.28)] transition-all duration-200 active:scale-95"
            aria-label="영수증 스캔"
          >
            <Camera className="h-5 w-5" />
          </button>

          <button
            onClick={() => go('/settings/budget')}
            className={`flex min-h-13 min-w-0 flex-col items-center justify-center px-2 py-1.5 transition-all duration-200 active:scale-95 ${
              isBudget ? 'text-[#006b5b] dark:text-emerald-400' : 'text-[#141716] dark:text-slate-300'
            }`}
            aria-label={t('nav_budget')}
          >
            <Target className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-semibold">{t('nav_budget')}</span>
          </button>

          <button
            onClick={() => go('/analytics')}
            className={`flex min-h-13 min-w-0 flex-col items-center justify-center px-2 py-1.5 transition-all duration-200 active:scale-95 ${
              isAnalytics ? 'text-[#006b5b] dark:text-emerald-400' : 'text-[#141716] dark:text-slate-300'
            }`}
            aria-label={t('nav_analytics')}
          >
            <BarChart2 className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-semibold">{t('nav_analytics')}</span>
          </button>

        </div>
      </div>
    </nav>
  )
}
