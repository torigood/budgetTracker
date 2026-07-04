import { useCallback, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { invalidateTransactionData } from '@/lib/hooks/useTransactions'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)

  const refreshVisibleQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['analytics'] })
    void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    void queryClient.invalidateQueries({ queryKey: ['calendar'] })
    void queryClient.invalidateQueries({ queryKey: ['widget-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['annual'] })
  }, [queryClient])

  // Supabase Realtime: 거래 변경 감지 → React Query invalidate
  useEffect(() => {
    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        invalidateTransactionData(queryClient)
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
  }, [refreshVisibleQueries])

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
    <div className="flex min-h-svh justify-center bg-[#202426] px-0 md:px-4 md:py-4">
      <div className="relative flex min-h-svh w-full max-w-[430px] flex-col overflow-hidden bg-[var(--fintra-bg)] text-[var(--color-text-primary)] md:min-h-[calc(100svh-2rem)] md:rounded-[2.7rem] md:border md:border-white/15 md:shadow-[0_34px_100px_rgba(0,0,0,0.34)] dark:bg-[#101114]">
        <main ref={mainRef} className="flex-1 overflow-y-auto pt-[calc(0.9rem+env(safe-area-inset-top))] pb-[calc(7.8rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>

        {/* Bottom nav lives inside the app canvas, matching the reference mockup */}
        <BottomNav />
      </div>
    </div>
  )
}
