import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)

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

  // Always start at the top when entering a route.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
    window.scrollTo({ top: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [location.pathname])

  return (
    <div className="flex min-h-svh justify-center bg-[#0d0d0d] px-0 md:px-4 md:py-4">
      <div className="relative flex min-h-svh w-full max-w-[430px] flex-col overflow-hidden bg-[#f4f5f8] text-[var(--color-text-primary)] md:min-h-[calc(100svh-2rem)] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-[0_30px_90px_rgba(0,0,0,0.45)] dark:bg-[#101114]">
        <main ref={mainRef} className="flex-1 overflow-y-auto pt-[calc(0.9rem+env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>

        {/* Bottom nav lives inside the app canvas, matching the reference mockup */}
        <BottomNav />
      </div>
    </div>
  )
}
