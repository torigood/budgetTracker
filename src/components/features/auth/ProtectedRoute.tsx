import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/auth.store'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
