import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Moon, Sun, Download, Upload, LogOut, User, Languages, Target, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { useT } from '@/lib/hooks/useT'
import { translations } from '@/lib/i18n'
import { PageHeader } from '@/components/ui/PageHeader'
import { getCurrentMonth } from '@/utils/format'
import { getNotifySettings, saveNotifySetting, requestPermission, getPermission, subscribeToPush } from '@/lib/hooks/useNotifications'
import type { Lang } from '@/lib/i18n'
import type { NotifySettings } from '@/lib/hooks/useNotifications'

const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'ko', label: '한국어', native: 'Korean' },
  { code: 'en', label: 'English', native: '영어' },
]

function SettingRow({
  icon,
  label,
  description,
  right,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  const El = onClick ? 'button' : 'div'
  return (
    <El
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-4 transition ${
        onClick ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 active:bg-slate-100/70 dark:active:bg-slate-700/50' : ''
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
        danger
          ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
      }`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-medium ${danger ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      {right}
    </El>
  )
}

function NotifyToggleRow({
  icon,
  label,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  enabled: boolean
  disabled?: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {icon}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => !disabled && onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${enabled && !disabled ? 'bg-[#0d8a7a]' : 'bg-slate-200 dark:bg-slate-700'}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
          style={{ marginTop: '2px' }}
        />
      </button>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isDark, toggleDark, lang, setLang } = useUIStore()
  const t = useT()
  const tr = translations[lang]
  const [exportFrom, setExportFrom] = useState(getCurrentMonth())
  const [exportTo, setExportTo] = useState(getCurrentMonth())
  const [notifySettings, setNotifySettings] = useState<NotifySettings>(getNotifySettings)
  const [permission, setPermission] = useState<ReturnType<typeof getPermission>>(getPermission)

  const updateNotify = useCallback(<K extends keyof NotifySettings>(key: K, value: NotifySettings[K]) => {
    const keyMap: Record<keyof NotifySettings, 'budgetEnabled' | 'monthlyBudgetEnabled' | 'reminderEnabled' | 'reminderTime' | 'anomalyEnabled'> = {
      budgetEnabled: 'budgetEnabled',
      monthlyBudgetEnabled: 'monthlyBudgetEnabled',
      reminderEnabled: 'reminderEnabled',
      reminderTime: 'reminderTime',
      anomalyEnabled: 'anomalyEnabled',
    }
    saveNotifySetting(keyMap[key], String(value))
    setNotifySettings(prev => ({ ...prev, [key]: value }))
  }, [])

  async function handleAllowNotifications() {
    const perm = await requestPermission()
    setPermission(perm === 'unsupported' ? 'unsupported' : perm)
    if (perm === 'granted') {
      toast.success('알림이 허용됐습니다')
      if (user?.id) await subscribeToPush(user.id)
    } else if (perm === 'denied') {
      toast.error(t('notify_denied'))
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
    else navigate('/', { replace: true })
  }

  async function handleExportCSV() {
    // from 시작일, to 마지막일 계산
    const start = `${exportFrom}-01`
    const toDate = new Date(exportTo + '-01')
    toDate.setMonth(toDate.getMonth() + 1)
    toDate.setDate(0) // 해당 월 마지막 날
    const end = toDate.toISOString().slice(0, 10)

    if (start > end) { toast.error(t('settings_export_date_error')); return }

    const { data, error } = await supabase
      .from('transactions')
      .select('date, type, description, amount, currency, payment_method, memo, categories(name)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (error) { toast.error(t('settings_export_fail')); return }
    if (!data?.length) { toast.error(t('settings_export_empty')); return }

    type ExportRow = {
      date: string; type: string; description: string; amount: number
      currency: string; payment_method: string; memo: string | null
      categories: { name: string } | null
    }

    const BOM = '\uFEFF'
    const headers = ['날짜', '유형', '내용', '금액', '통화', '결제수단', '카테고리', '메모']
    const rows = ((data ?? []) as unknown as ExportRow[]).map((row) => {
      return [
        row.date, row.type, row.description, row.amount, row.currency,
        row.payment_method, row.categories?.name ?? '', row.memo ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })
    const csv = BOM + [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const suffix = exportFrom === exportTo ? exportFrom : `${exportFrom}_${exportTo}`
    a.download = `budget_${suffix}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(tr.settings_export_success_n(data.length))
  }

  return (
    <div className="pb-6">
      <PageHeader title={t('settings_title')} back backTo="/dashboard" />

      <div className="space-y-4 px-4 py-4">
        {/* 계정 정보 */}
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('settings_account')}</p>
          <div className="card overflow-hidden rounded-3xl">
            <SettingRow
              icon={<User className="h-4 w-4" />}
              label={user?.email ?? 'User'}
              description={t('settings_account_desc')}
            />
          </div>
        </div>

        {/* 일반 설정 */}
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('settings_general')}</p>
          <div className="card divide-y divide-slate-100/80 overflow-hidden rounded-3xl dark:divide-slate-800/70">
            {/* 다크모드 */}
            <SettingRow
              icon={isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              label={t('settings_dark')}
              description={isDark ? t('settings_dark_on') : t('settings_dark_off')}
              right={
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDark() }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8a7a] ${isDark ? 'bg-[#0d8a7a]' : 'bg-slate-200 dark:bg-slate-700'}`}
                  role="switch"
                  aria-checked={isDark}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`}
                    style={{ marginTop: '2px' }}
                  />
                </button>
              }
            />
          </div>
        </div>

        {/* 언어 선택 */}
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('settings_language')}</p>
          <div className="card rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">{t('settings_language_label')}</p>
            </div>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-center transition active:scale-[0.99] ${
                    lang === l.code
                      ? 'border-[#0d8a7a] bg-[#dbefeb] text-[#0d8a7a] dark:bg-[#0d8a7a]/20 dark:text-[#9fe3d9]'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`text-sm font-bold tracking-tight ${lang === l.code ? 'text-[#0d8a7a] dark:text-[#9fe3d9]' : 'text-slate-900 dark:text-white'}`}>
                    {l.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{l.native}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 데이터 가져오기/내보내기 */}
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('settings_data')}</p>
          <div className="card divide-y divide-slate-100/80 overflow-hidden rounded-3xl mb-3 dark:divide-slate-800/70">
            <SettingRow
              icon={<Upload className="h-4 w-4" />}
              label={t('settings_csv_import')}
              description={t('settings_csv_import_desc')}
              onClick={() => navigate('/csv-import')}
              right={<ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />}
            />
          </div>
          <div className="card rounded-3xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">{t('settings_csv_export')}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="w-14 shrink-0 text-xs text-slate-400">{t('settings_export_from')}</p>
                <input
                  type="month"
                  value={exportFrom}
                  onChange={(e) => {
                    setExportFrom(e.target.value)
                    if (e.target.value > exportTo) setExportTo(e.target.value)
                  }}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-[#0d8a7a] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <p className="w-14 shrink-0 text-xs text-slate-400">{t('settings_export_to')}</p>
                <input
                  type="month"
                  value={exportTo}
                  min={exportFrom}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-[#0d8a7a] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {exportFrom === exportTo
                ? tr.settings_export_one_month(exportFrom)
                : tr.settings_export_range(exportFrom, exportTo)}
            </p>
            <button
              onClick={handleExportCSV}
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <Download className="h-4 w-4" />
              {t('settings_csv_export')}
            </button>
          </div>
        </div>

        {/* 알림 */}
        <div>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('notify_title')}</p>
          <div className="card divide-y divide-slate-100/80 overflow-hidden rounded-3xl dark:divide-slate-800/70">
            {/* Permission status */}
            {permission !== 'granted' && (
              <div className="px-4 py-3.5 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-900/20">
                  <BellOff className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{t('notify_title')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {permission === 'denied' ? t('notify_denied') : t('notify_desc')}
                  </p>
                </div>
                {permission !== 'denied' && (
                  <button
                    onClick={handleAllowNotifications}
                    className="shrink-0 rounded-full bg-[#0d8a7a] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0a7568]"
                  >
                    {t('notify_allow')}
                  </button>
                )}
              </div>
            )}

            {/* A: Budget alert */}
            <NotifyToggleRow
              icon={<Target className="h-4 w-4" />}
              label={t('notify_budget_label')}
              description={t('notify_budget_desc')}
              enabled={notifySettings.budgetEnabled}
              disabled={permission !== 'granted'}
              onToggle={(v) => updateNotify('budgetEnabled', v)}
            />

            {/* B: Daily reminder */}
            <div>
              <NotifyToggleRow
                icon={<Bell className="h-4 w-4" />}
                label={t('notify_reminder_label')}
                description={t('notify_reminder_desc')}
                enabled={notifySettings.reminderEnabled}
                disabled={permission !== 'granted'}
                onToggle={(v) => updateNotify('reminderEnabled', v)}
              />
              {notifySettings.reminderEnabled && permission === 'granted' && (
                <div className="px-4 pb-3.5 flex items-center gap-3">
                  <div className="w-8 shrink-0" />
                  <p className="text-xs text-slate-500 shrink-0">{t('notify_reminder_time')}</p>
                  <input
                    type="time"
                    value={notifySettings.reminderTime}
                    onChange={(e) => updateNotify('reminderTime', e.target.value)}
                    className="ml-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0d8a7a] transition"
                  />
                </div>
              )}
            </div>

            {/* C: Anomaly detection */}
            <NotifyToggleRow
              icon={<Bell className="h-4 w-4" />}
              label={t('notify_anomaly_label')}
              description={t('notify_anomaly_desc')}
              enabled={notifySettings.anomalyEnabled}
              disabled={permission !== 'granted'}
              onToggle={(v) => updateNotify('anomalyEnabled', v)}
            />
          </div>
        </div>

        {/* 로그아웃 */}
        <div className="pb-8">
          <div className="card overflow-hidden">
            <SettingRow
              icon={<LogOut className="h-4 w-4" />}
              label={t('settings_logout')}
              onClick={handleLogout}
              danger
            />
          </div>
        </div>
      </div>
    </div>
  )
}
