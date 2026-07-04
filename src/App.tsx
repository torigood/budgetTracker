import { useEffect, useState } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute'
import { AppLayout } from '@/components/features/layout/AppLayout'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { PWAUpdatePrompt } from '@/components/ui/PWAUpdatePrompt'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'

import Landing from '@/pages/Landing'
import Policy from '@/pages/Policy'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/app/Dashboard'
import Transactions from '@/pages/app/Transactions'
import TransactionNew from '@/pages/app/TransactionNew'
import TransactionEdit from '@/pages/app/TransactionEdit'
import Receipt from '@/pages/app/Receipt'
import Analytics from '@/pages/app/Analytics'
import Recurring from '@/pages/app/Recurring'
import Calendar from '@/pages/app/Calendar'
import Settings from '@/pages/app/Settings'
import SettingsCategories from '@/pages/app/SettingsCategories'
import SettingsBudget from '@/pages/app/SettingsBudget'
import CsvImport from '@/pages/app/CsvImport'
import NotFound from '@/pages/NotFound'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/privacy', element: <Policy /> },
  { path: '/terms', element: <Policy /> },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/transactions/new', element: <TransactionNew /> },
      { path: '/transactions/:id/edit', element: <TransactionEdit /> },
      { path: '/receipt', element: <Receipt /> },
      { path: '/analytics', element: <Analytics /> },
      { path: '/calendar', element: <Calendar /> },
      { path: '/recurring', element: <Recurring /> },
      { path: '/settings', element: <Settings /> },
      { path: '/settings/categories', element: <SettingsCategories /> },
      { path: '/settings/budget', element: <SettingsBudget /> },
      { path: '/csv-import', element: <CsvImport /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export default function App() {
  const { loading, setSession, setLoading } = useAuthStore()
  const lang = useUIStore((state) => state.lang)
  const isDark = useUIStore((state) => state.isDark)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (loading) return undefined

    const timer = window.setTimeout(() => setShowSplash(false), 900)
    return () => window.clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    const iconHref = '/icons/logo_512.png'
    const manifestHref = '/manifest.webmanifest'
    const themeColor = isDark ? '#0d0d0d' : '#f5f6f8'

    const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null
    if (favicon) favicon.href = iconHref

    const appleTouchIcon = document.getElementById('app-apple-touch-icon') as HTMLLinkElement | null
    if (appleTouchIcon) appleTouchIcon.href = iconHref

    const manifest = document.getElementById('app-manifest') as HTMLLinkElement | null
    if (manifest) manifest.href = manifestHref

    const themeColorMeta = document.getElementById('app-theme-color') as HTMLMetaElement | null
    if (themeColorMeta) themeColorMeta.setAttribute('content', themeColor)
  }, [isDark])

  if (loading || showSplash) return <SplashScreen />

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <PWAUpdatePrompt />
      <VercelAnalytics />
    </ErrorBoundary>
  )
}
