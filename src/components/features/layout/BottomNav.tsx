import { useState, useRef, useEffect, useTransition } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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

  function togglePopup() {
    setPopupOpen((v) => !v)
  }

  const navIcon = location.pathname.startsWith('/recurring')
    ? <RefreshCw className="h-6 w-6" />
    : <List className="h-6 w-6" />

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="flex w-full max-w-md items-end justify-between gap-1 rounded-[2rem] border border-white/70 bg-white/80 px-2 py-2 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80">
        {/* 홈 */}
        <button
          onClick={() => go('/dashboard')}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-200 active:scale-95 ${
            location.pathname.startsWith('/dashboard') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-label={t('nav_home')}
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${location.pathname.startsWith('/dashboard') ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'}`}>
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-tight">{t('nav_home')}</span>
        </button>

        {/* 거래내역 (팝업 트리거) */}
        <div className="relative flex flex-[1.15] flex-col items-center">
          {/* 팝업 */}
          {popupOpen && (
            <div
              ref={popupRef}
              className="absolute bottom-[calc(100%+0.75rem)] left-1/2 z-50 w-52 -translate-x-1/2 rounded-[1.75rem] border border-white/70 bg-white/95 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95"
            >
              <button
                onClick={() => go('/transactions')}
                className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 active:scale-[0.99] dark:hover:bg-slate-800 ${
                  location.pathname.startsWith('/transactions')
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <List className="h-4 w-4 shrink-0" />
                {t('nav_transactions')}
              </button>
              <button
                onClick={() => go('/recurring')}
                className={`mt-1 flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 active:scale-[0.99] dark:hover:bg-slate-800 ${
                  location.pathname.startsWith('/recurring')
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                {t('nav_recurring')}
              </button>
            </div>
          )}

          <button
            ref={triggerRef}
            onClick={togglePopup}
            className={`relative z-10 flex min-h-12 min-w-0 flex-col items-center justify-center rounded-2xl px-3 py-2 transition-all duration-200 active:scale-95 ${
              isTransactionActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
            }`}
            aria-haspopup="menu"
            aria-expanded={popupOpen}
            aria-label={t('nav_transactions')}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
              isTransactionActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
            }`}>
              {navIcon}
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-tight">{t('nav_transactions')}</span>
          </button>
        </div>

        {/* 영수증 FAB */}
        <button
          onClick={() => go('/receipt')}
          className="flex min-h-12 min-w-0 flex-1 -translate-y-4 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-200 active:scale-95"
          aria-label={t('nav_receipt')}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-indigo-500 via-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20">
            <Camera className="h-5 w-5" />
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-tight text-indigo-500">{t('nav_receipt')}</span>
        </button>

        {/* 분석 */}
        <button
          onClick={() => go('/analytics')}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-200 active:scale-95 ${
            location.pathname.startsWith('/analytics') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-label={t('nav_analytics')}
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${location.pathname.startsWith('/analytics') ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'}`}>
            <BarChart2 className="h-5 w-5" />
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-tight">{t('nav_analytics')}</span>
        </button>

        {/* 설정 */}
        <button
          onClick={() => go('/settings')}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-200 active:scale-95 ${
            location.pathname.startsWith('/settings') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-label={t('nav_settings')}
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${location.pathname.startsWith('/settings') ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'}`}>
            <Settings className="h-5 w-5" />
          </span>
          <span className="mt-1 text-[10px] font-semibold tracking-tight">{t('nav_settings')}</span>
        </button>
      </div>
    </nav>
  )
}
