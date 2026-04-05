import { useState, useRef, useEffect } from 'react'
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

  const tabs = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav_home') },
    { to: '/receipt', icon: Camera, label: t('nav_receipt'), fab: true },
    { to: '/analytics', icon: BarChart2, label: t('nav_analytics') },
    { to: '/settings', icon: Settings, label: t('nav_settings') },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-end justify-around border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 홈 */}
      <NavLink
        to="/dashboard"
        end
        className={({ isActive }) =>
          `flex flex-col items-center py-3 px-3 transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
              <LayoutDashboard className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-medium">{t('nav_home')}</span>
          </>
        )}
      </NavLink>

      {/* 거래내역 (팝업 트리거) */}
      <div className="relative flex flex-col items-center">
        {/* 팝업 */}
        {popupOpen && (
          <div
            ref={popupRef}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-black/10 overflow-hidden"
          >
            <button
              onClick={() => { navigate('/transactions'); setPopupOpen(false) }}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                location.pathname.startsWith('/transactions')
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <List className="h-3.5 w-3.5 shrink-0" />
              {t('nav_transactions')}
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            <button
              onClick={() => { navigate('/recurring'); setPopupOpen(false) }}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                location.pathname.startsWith('/recurring')
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              {t('nav_recurring')}
            </button>
          </div>
        )}

        <button
          ref={triggerRef}
          onClick={() => setPopupOpen((v) => !v)}
          className={`flex flex-col items-center py-3 px-3 transition-colors ${
            isTransactionActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            isTransactionActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''
          }`}>
            <List className="h-5 w-5" />
          </span>
          <span className="mt-0.5 text-[10px] font-medium">{t('nav_transactions')}</span>
        </button>
      </div>

      {/* 영수증 FAB */}
      <button
        onClick={() => navigate('/receipt')}
        className="flex flex-col items-center py-2 px-3 -translate-y-3"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/35 active:scale-95 transition">
          <Camera className="h-5 w-5 text-white" />
        </span>
        <span className="mt-1 text-[10px] font-semibold text-indigo-500">{t('nav_receipt')}</span>
      </button>

      {/* 분석 */}
      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `flex flex-col items-center py-3 px-3 transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
              <BarChart2 className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-medium">{t('nav_analytics')}</span>
          </>
        )}
      </NavLink>

      {/* 설정 */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center py-3 px-3 transition-colors ${
            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
              <Settings className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-medium">{t('nav_settings')}</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
