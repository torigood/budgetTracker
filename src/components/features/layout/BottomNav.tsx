import { useState, useRef, useEffect, useTransition } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, List, Camera, BarChart2, Settings, RefreshCw } from 'lucide-react'
import { useT } from '@/lib/hooks/useT'

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const [popupOpen, setPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [, startTransition] = useTransition()

  const isTransactionActive =
    location.pathname.startsWith('/transactions') || location.pathname.startsWith('/recurring')

  // 바깥 탭하면 팝업 닫기
  useEffect(() => {
    if (!popupOpen) return
    function onPointerDown(e: PointerEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setPopupOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [popupOpen])

  function go(to: string) {
    setPopupOpen(false)
    startTransition(() => navigate(to))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* 홈 */}
      <NavLink
        to="/dashboard"
        end
        className={({ isActive }) =>
          `flex min-h-11 min-w-18 flex-col items-center justify-center px-3 py-2.5 transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
              <LayoutDashboard className="h-5.5 w-5.5" />
            </span>
            <span className="mt-0.5 text-[11px] font-semibold">{t('nav_home')}</span>
          </>
        )}
      </NavLink>

      {/* 거래내역 (팝업 트리거) */}
      <div className="relative flex flex-col items-center">
        {/* 팝업 */}
        {popupOpen && (
          <div
            ref={popupRef}
            className="animate-nav-pop absolute bottom-full left-1/2 mb-2.5 w-44 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-black/12 dark:border-slate-700 dark:bg-slate-900"
          >
            <button
              onClick={() => go('/transactions')}
              className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                location.pathname.startsWith('/transactions')
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <List className="h-4.5 w-4.5 shrink-0" />
              {t('nav_transactions')}
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            <button
              onClick={() => go('/recurring')}
              className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                location.pathname.startsWith('/recurring')
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <RefreshCw className="h-4.5 w-4.5 shrink-0" />
              {t('nav_recurring')}
            </button>
          </div>
        )}

        <button
          ref={triggerRef}
          onClick={() => setPopupOpen((v) => !v)}
          className={`flex min-h-11 min-w-20 flex-col items-center justify-center rounded-xl px-3 py-2.5 transition-colors ${
            isTransactionActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-haspopup="menu"
          aria-expanded={popupOpen}
          aria-label={t('nav_transactions')}
        >
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            isTransactionActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''
          }`}>
            <List className="h-6 w-6" />
          </span>
          <span className="mt-0.5 text-[11px] font-semibold">{t('nav_transactions')}</span>
        </button>
      </div>

      {/* 영수증 FAB */}
      <button
        onClick={() => go('/receipt')}
        className="flex min-h-11 min-w-18 flex-col items-center px-3 py-2 -translate-y-3"
        aria-label={t('nav_receipt')}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/35 active:scale-95 transition">
          <Camera className="h-5 w-5 text-white" />
        </span>
        <span className="mt-1 text-[11px] font-semibold text-indigo-500">{t('nav_receipt')}</span>
      </button>

      {/* 분석 */}
      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `flex min-h-11 min-w-18 flex-col items-center justify-center px-3 py-2.5 transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
              <BarChart2 className="h-5.5 w-5.5" />
            </span>
            <span className="mt-0.5 text-[11px] font-semibold">{t('nav_analytics')}</span>
          </>
        )}
      </NavLink>

      {/* 설정 */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex min-h-11 min-w-18 flex-col items-center justify-center px-3 py-2.5 transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
              <Settings className="h-5.5 w-5.5" />
            </span>
            <span className="mt-0.5 text-[11px] font-semibold">{t('nav_settings')}</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
