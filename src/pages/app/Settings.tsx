import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Moon, Sun, Download, Upload, LogOut, Tag, User, Coins, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore, SUPPORTED_CURRENCIES } from '@/lib/stores/ui.store'
import { useT } from '@/lib/hooks/useT'
import { PageHeader } from '@/components/ui/PageHeader'
import { getCurrentMonth } from '@/utils/format'
import type { Lang } from '@/lib/i18n'

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
      className={`flex w-full items-center gap-3 px-4 py-3.5 transition ${
        onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-700/50' : ''
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
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

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isDark, toggleDark, currency, setCurrency, lang, setLang } = useUIStore()
  const t = useT()
  const [exportFrom, setExportFrom] = useState(getCurrentMonth())
  const [exportTo, setExportTo] = useState(getCurrentMonth())

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
  }

  async function handleExportCSV() {
    // from 시작일, to 마지막일 계산
    const start = `${exportFrom}-01`
    const toDate = new Date(exportTo + '-01')
    toDate.setMonth(toDate.getMonth() + 1)
    toDate.setDate(0) // 해당 월 마지막 날
    const end = toDate.toISOString().slice(0, 10)

    if (start > end) { toast.error('시작 월이 종료 월보다 늦습니다'); return }

    const { data, error } = await supabase
      .from('transactions')
      .select('date, type, description, amount, currency, payment_method, memo, categories(name)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (error) { toast.error('내보내기 실패'); return }
    if (!data?.length) { toast.error('해당 기간에 거래 내역이 없습니다'); return }

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
    toast.success(`${data.length}개 거래 내역을 내보냈습니다`)
  }

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency)

  return (
    <div>
      <PageHeader title={t('settings_title')} />

      <div className="p-4 space-y-4">
        {/* 계정 정보 */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('settings_account')}</p>
          <div className="card overflow-hidden">
            <SettingRow
              icon={<User className="h-4 w-4" />}
              label={user?.email ?? 'User'}
              description={t('settings_account_desc')}
            />
          </div>
        </div>

        {/* 일반 설정 */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('settings_general')}</p>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {/* 다크모드 */}
            <SettingRow
              icon={isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              label={t('settings_dark')}
              description={isDark ? t('settings_dark_on') : t('settings_dark_off')}
              right={
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDark() }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDark ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
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

            {/* 카테고리 관리 */}
            <SettingRow
              icon={<Tag className="h-4 w-4" />}
              label={t('settings_categories')}
              description={t('settings_categories_desc')}
              onClick={() => navigate('/settings/categories')}
              right={<ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />}
            />
          </div>
        </div>

        {/* 언어 선택 */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('settings_language')}</p>
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">{t('settings_language_label')}</p>
            </div>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-center transition ${
                    lang === l.code
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`text-sm font-bold ${lang === l.code ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {l.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{l.native}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 통화 설정 */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('settings_currency_title')}</p>
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">기본 통화</p>
                <p className="text-xs text-slate-400 mt-0.5">새 거래 추가 시 기본으로 선택됩니다</p>
              </div>
              <span className="text-xs font-semibold text-indigo-500">{selectedCurrencyInfo?.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    currency === c.code
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`text-sm font-semibold ${currency === c.code ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {c.code}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.label.split(' ')[0]}{' '}{c.label.match(/\((.+)\)/)?.[1]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 데이터 가져오기/내보내기 */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('settings_data')}</p>
          <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mb-3">
            <SettingRow
              icon={<Upload className="h-4 w-4" />}
              label="CSV 가져오기"
              description="가계부 CSV 파일로 거래 내역을 일괄 추가"
              onClick={() => navigate('/csv-import')}
              right={<ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />}
            />
          </div>
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">CSV 내보내기</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-xs text-slate-400">시작 월</p>
                <input
                  type="month"
                  value={exportFrom}
                  onChange={(e) => {
                    setExportFrom(e.target.value)
                    if (e.target.value > exportTo) setExportTo(e.target.value)
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">종료 월</p>
                <input
                  type="month"
                  value={exportTo}
                  min={exportFrom}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
            {exportFrom === exportTo ? (
              <p className="text-xs text-slate-400">{exportFrom} 1개월 내보내기</p>
            ) : (
              <p className="text-xs text-slate-400">{exportFrom} ~ {exportTo} 내보내기</p>
            )}
            <button
              onClick={handleExportCSV}
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <Download className="h-4 w-4" />
              CSV 내보내기
            </button>
          </div>
        </div>

        {/* 로그아웃 */}
        <div>
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
