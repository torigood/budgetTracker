import { NavLink, useNavigate } from 'react-router-dom'
import { Home, List, Camera, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/transactions', icon: List, label: '거래' },
  { to: '/receipt', icon: Camera, label: '영수증', fab: true },
  { to: '/analytics', icon: BarChart2, label: '분석' },
  { to: '/settings', icon: Settings, label: '설정' },
]

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-end justify-around border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden"
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
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30 active:scale-95 transition">
                <Icon className="h-6 w-6 text-white" />
              </span>
              <span className="mt-1 text-[10px] text-blue-500 font-medium">{label}</span>
            </button>
          )
        }
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 transition ${
                isActive
                  ? 'text-blue-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`
            }
          >
            <Icon className="h-6 w-6" />
            <span className="mt-0.5 text-[10px] font-medium">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
