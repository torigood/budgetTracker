import { useNavigate } from 'react-router-dom'
import { useT } from '@/lib/hooks/useT'

export default function NotFound() {
  const navigate = useNavigate()
  const t = useT()

  return (
    <div className="flex flex-col items-center justify-center min-h-svh gap-4 p-6 text-center bg-white dark:bg-slate-950">
      <span className="text-6xl">🤔</span>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('not_found')}</h1>
      <p className="text-slate-500">{t('not_found_desc')}</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-primary px-6 py-3 text-sm"
      >
        {t('go_home')}
      </button>
    </div>
  )
}
