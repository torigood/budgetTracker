import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui.store'

export function PWAUpdatePrompt() {
  const { lang } = useUIStore()
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-white px-4 py-3.5 shadow-2xl shadow-black/25 border border-slate-700 dark:border-slate-200">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white">
          <RefreshCw className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white dark:text-slate-900">
            {lang === 'ko' ? '새 버전이 있어요' : 'Update available'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {lang === 'ko' ? '지금 업데이트하면 최신 기능을 사용할 수 있어요' : 'Reload to get the latest features'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 active:scale-95 transition"
          >
            {lang === 'ko' ? '업데이트' : 'Update'}
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-800 dark:hover:bg-slate-100 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
