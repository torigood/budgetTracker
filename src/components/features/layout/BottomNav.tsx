import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Camera, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: '홈' },
  { to: '/calendar', icon: CalendarDays, label: '캘린더' },
  { to: '/receipt', icon: Camera, label: '영수증', fab: true },
  { to: '/analytics', icon: BarChart2, label: '분석' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-end justify-around border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, icon: Icon, label, fab }) => {
        if (fab) {
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col items-center py-2 px-3 -translate-y-3"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/35 active:scale-95 transition">
                <Icon className="h-5 w-5 text-white" />
              </span>
              <span className="mt-1 text-[10px] font-semibold text-indigo-500">{label}</span>
            </button>
          )
        }
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center py-3 px-3 transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-0.5 text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
