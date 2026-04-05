import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Moon, Sun, Download, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useUIStore } from '@/lib/stores/ui.store'
import { PageHeader } from '@/components/ui/PageHeader'
import { getMonthRange, getCurrentMonth } from '@/utils/format'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isDark, toggleDark } = useUIStore()
  const [exportMonth, setExportMonth] = useState(getCurrentMonth())

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error.message)
  }

  async function handleExportCSV() {
    const { start, end } = getMonthRange(exportMonth)
    const { data, error } = await supabase
      .from('transactions')
      .select('date, type, description, amount, currency, payment_method, memo, categories(name)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (error) { toast.error('내보내기 실패'); return }

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
    a.download = `budget_${exportMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV 파일이 다운로드됐습니다')
  }

  return (
    <div>
      <PageHeader title="설정" />

      <div className="p-4 space-y-4">
        {/* 사용자 정보 */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 mb-1">계정</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
        </div>

        {/* 다크모드 */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
            <span className="text-sm font-medium text-gray-900 dark:text-white">다크모드</span>
          </div>
          <button
            onClick={toggleDark}
            className={`relative h-6 w-11 rounded-full transition-colors ${isDark ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* 카테고리 관리 */}
        <button
          onClick={() => navigate('/settings/categories')}
          className="w-full flex items-center justify-between rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-white">카테고리 관리</span>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* CSV 내보내기 */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm space-y-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">CSV 내보내기</p>
          <div className="flex gap-3">
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white"
            >
              <Download className="h-4 w-4" />
              내보내기
            </button>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm text-sm font-medium text-red-500"
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </button>
      </div>
    </div>
  )
}
