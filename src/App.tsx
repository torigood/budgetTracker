import { useEffect } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute'
import { AppLayout } from '@/components/features/layout/AppLayout'

import Landing from '@/pages/Landing'
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
  const { setSession, setLoading } = useAuthStore()

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

  return <RouterProvider router={router} />
}
