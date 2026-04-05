import { NavLink } from 'react-router-dom'
import { Home, List, Camera, BarChart2, Settings, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/transactions', icon: List, label: '거래내역' },
  { to: '/receipt', icon: Camera, label: '영수증 촬영' },
  { to: '/analytics', icon: BarChart2, label: '분석' },
  { to: '/recurring', icon: RefreshCw, label: '자동지출' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export function SideNav() {
  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <span className="text-2xl">💰</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">Budget Tracker</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
