import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'

export function AppLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
    <div className="relative flex min-h-svh overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-500/10" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10" />

      {/* Desktop sidebar */}
      <SideNav />

      {/* Main content */}
      <div className="relative z-10 flex-1 md:ml-64">
        <main className="pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
