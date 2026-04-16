import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/lib/stores/ui.store'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'

export function AppLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isDark = useUIStore((state) => state.isDark)
  const logoSrc = isDark ? '/icons/logo_dark_512.png' : '/icons/logo_light_512.png'

  function refreshVisibleQueries() {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['analytics'] })
    void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    void queryClient.invalidateQueries({ queryKey: ['widget-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['annual'] })
  }

  // Supabase Realtime: 거래 변경 감지 → React Query invalidate
  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['transactions'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [queryClient])

  // Quietly refresh active data when user returns to the app/tab
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshVisibleQueries()
      }
    }

    function onFocus() {
      refreshVisibleQueries()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onFocus)
    }
  }, [queryClient])

  // 키보드 단축키 (데스크탑)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'n' || e.key === 'N') navigate('/transactions/new')
      if (e.key === 'r' || e.key === 'R') navigate('/receipt')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate])

  return (
    <div className="relative flex min-h-svh overflow-x-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />

      {/* Desktop sidebar */}
      <SideNav />

      {/* Main content */}
      <div className="relative z-10 flex-1 md:ml-64">
        <div className="sticky top-0 z-30 border-b border-white/10 bg-white/85 backdrop-blur-sm dark:bg-[rgba(8,8,15,0.82)] md:hidden">
          <div className="flex items-center gap-2.5 px-4 pb-2 pt-[calc(0.6rem+env(safe-area-inset-top))]">
            <img src={logoSrc} alt="Budget Tracker" className="h-8 w-8 rounded-lg border border-white/10 object-cover" />
            <span className="text-sm font-semibold tracking-tight text-[var(--color-text-primary)]">Budget Tracker</span>
          </div>
        </div>
        <main className="pt-2 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pt-3 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
