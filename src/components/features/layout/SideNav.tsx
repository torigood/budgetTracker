import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, Camera, BarChart2, Settings, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
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
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-xl shadow-sm">
          💰
        </span>
        <span className="text-base font-bold text-slate-900 dark:text-white">Budget Tracker</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-800/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                }`}>
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 group-hover:text-rose-500 transition-colors">
            <LogOut className="h-4 w-4" />
          </span>
          로그아웃
        </button>
      </div>
    </aside>
  )
}
