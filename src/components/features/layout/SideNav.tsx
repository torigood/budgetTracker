import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, Camera, BarChart2, Settings, RefreshCw, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useT } from '@/lib/hooks/useT'

export function SideNav() {
  const t = useT()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav_dashboard') },
    { to: '/transactions', icon: List, label: t('nav_transactions') },
    { to: '/receipt', icon: Camera, label: t('nav_receipt') },
    { to: '/analytics', icon: BarChart2, label: t('nav_analytics') },
    { to: '/recurring', icon: RefreshCw, label: t('nav_recurring') },
    { to: '/settings', icon: Settings, label: t('nav_settings') },
  ]

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-white/70 bg-white/75 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70 md:flex">
      {/* Logo */}
      <div className="mx-3 mt-3 flex items-center gap-3 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 via-indigo-500 to-cyan-500 px-4 py-4 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
          <img src="/icons/logo512.png" alt="Budget Tracker" className="h-8 w-8 rounded-xl object-cover" />
        </div>
        <div>
          <span className="block text-base font-semibold tracking-tight">Budget Tracker</span>
          <span className="block text-[11px] font-medium text-white/75">Smart money, calm UI</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-700 dark:bg-slate-800/80 dark:text-slate-500 dark:group-hover:bg-slate-700/80 dark:group-hover:text-white'
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
      <div className="px-3 pb-5 pt-3">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-rose-100 group-hover:text-rose-500 dark:bg-slate-800/80 dark:text-slate-500 dark:group-hover:bg-rose-900/30 dark:group-hover:text-rose-300">
            <LogOut className="h-4 w-4" />
          </span>
          {t('nav_logout')}
        </button>
      </div>
    </aside>
  )
}
