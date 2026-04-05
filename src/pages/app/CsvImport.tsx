import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Check, X, AlertTriangle, ChevronDown } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import { useCategories } from '@/lib/hooks/useCategories'
import { useUIStore } from '@/lib/stores/ui.store'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PAYMENT_METHODS } from '@/types/app'
import type { PaymentMethod, TransactionType } from '@/types/app'
import { parseCsvRow, parseRawRow, MAX_CSV_ROWS } from '@/lib/utils/csvParser'

// ── Types ───────────────────────────────────────────────────────────────────
interface CsvRow {
  id: number
  date: string
  type: TransactionType
  csvCategory: string
  description: string
  amount: number
  payment: PaymentMethod
  memo: string
  // mapped values (editable)
  categoryId: string | null
  include: boolean
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

// ── Component ───────────────────────────────────────────────────────────────
export default function CsvImport() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currency } = useUIStore()
  const { data: categories = [] } = useCategories()

  const [step, setStep] = useState<Step>('upload')
  const [rows, setRows] = useState<CsvRow[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [fileName, setFileName] = useState('')

  // ── Fuzzy category match ─────────────────────────────────────────────────
  function matchCategory(csvCat: string): string | null {
    if (!csvCat) return null
    const norm = csvCat.trim().toLowerCase()
    const exact = categories.find((c) => c.name.toLowerCase() === norm)
    if (exact) return exact.id
    const partial = categories.find(
      (c) => c.name.toLowerCase().includes(norm) || norm.includes(c.name.toLowerCase())
    )
    return partial?.id ?? null
  }

  // ── Parse file ──────────────────────────────────────────────────────────
  function parseFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      // skip header row
      const dataLines = lines.slice(1)
      const parsed: CsvRow[] = []
      let id = 0
      for (const line of dataLines) {
        const cols = parseCsvRow(line)
        const row = parseRawRow(cols)
        if (!row) continue

        parsed.push({
          id: id++,
          ...row,
          categoryId: matchCategory(row.csvCategory),
          include: true,
        })
      }

      if (parsed.length === 0) {
        toast.error('가져올 수 있는 행이 없습니다. CSV 형식을 확인해주세요.')
        return
      }

      if (parsed.length > MAX_CSV_ROWS) {
        toast.error(`한 번에 최대 ${MAX_CSV_ROWS.toLocaleString()}행까지만 가져올 수 있습니다.`)
        return
      }

      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'utf-8')
  }

  // ── Dropzone ────────────────────────────────────────────────────────────
  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (file) parseFile(file)
  }, [categories]) // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    noClick: false,
    onDropRejected: () => toast.error('파일 크기는 5MB 이하의 CSV 파일만 지원합니다'),
  })

  // ── Row updaters ────────────────────────────────────────────────────────
  function setRowField<K extends keyof CsvRow>(id: number, key: K, value: CsvRow[K]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  function toggleAll(checked: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, include: checked })))
  }

  // ── Import ──────────────────────────────────────────────────────────────
  async function handleImport() {
    if (!user) return
    const toImport = rows.filter((r) => r.include)
    if (toImport.length === 0) { toast.error('가져올 항목을 선택해주세요'); return }

    setStep('importing')
    try {
      const inserts = toImport.map((r) => ({
        user_id: user.id,
        date: r.date,
        type: r.type,
        description: r.description || r.csvCategory,
        amount: r.amount,
        currency,
        payment_method: r.payment,
        memo: r.memo || null,
        category_id: r.categoryId || null,
      }))

      // insert in chunks of 100
      let count = 0
      for (let i = 0; i < inserts.length; i += 100) {
        const chunk = inserts.slice(i, i + 100)
        const { error } = await supabase.from('transactions').insert(chunk)
        if (error) throw error
        count += chunk.length
      }

      setImportedCount(count)
      setStep('done')
    } catch (err) {
      console.error('CSV import error:', err)
      toast.error('가져오기에 실패했습니다. 다시 시도해주세요.')
      setStep('preview')
    }
  }

  const includedCount = rows.filter((r) => r.include).length

  // ── Upload step ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div>
        <PageHeader title="CSV 가져오기" back />
        <div className="p-4 space-y-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`mb-4 h-12 w-12 transition ${isDragActive ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isDragActive ? 'CSV 파일을 놓아주세요' : 'CSV 파일을 드래그하거나 클릭해서 선택'}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">가계부 형식 (.csv) 지원</p>
          </div>

          {/* Format hint */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">지원 형식</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-500 dark:text-slate-400">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {['날짜', '구분', '카테고리', '상세 내용', '금액', '결제 수단', '메모'].map((h) => (
                      <th key={h} className="pb-1.5 pr-3 text-left font-semibold text-slate-600 dark:text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 pr-3">2026-01-01</td>
                    <td className="pr-3">지출</td>
                    <td className="pr-3">식비</td>
                    <td className="pr-3">마트</td>
                    <td className="pr-3">32.50</td>
                    <td className="pr-3">크레딧</td>
                    <td>메모</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Importing step ──────────────────────────────────────────────────────
  if (step === 'importing') {
    return (
      <div>
        <PageHeader title="CSV 가져오기" back />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500">{includedCount}개 항목 저장 중...</p>
        </div>
      </div>
    )
  }

  // ── Done step ───────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div>
        <PageHeader title="CSV 가져오기" back />
        <div className="flex flex-col items-center justify-center py-32 gap-5 p-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-10 w-10 text-emerald-500" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{importedCount}개 항목을 가져왔어요!</p>
            <p className="mt-1 text-sm text-slate-500">거래 내역에서 확인할 수 있습니다</p>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="btn btn-primary px-8"
          >
            거래 내역 보기
          </button>
        </div>
      </div>
    )
  }

  // ── Preview step ─────────────────────────────────────────────────────────
  const allChecked = rows.every((r) => r.include)
  const someUncategorized = rows.some((r) => r.include && !r.categoryId)

  return (
    <div>
      <PageHeader title="CSV 가져오기" back />

      <div className="p-4 space-y-3">
        {/* Summary bar */}
        <div className="card px-4 py-3 flex items-center gap-3">
          <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{fileName}</p>
            <p className="text-xs text-slate-400">{rows.length}개 행 파싱됨</p>
          </div>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{includedCount}개 선택</span>
        </div>

        {someUncategorized && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            카테고리가 매핑되지 않은 항목이 있습니다. 가져온 후 거래 편집에서 수정할 수 있습니다.
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-4 w-4 accent-indigo-500 shrink-0"
            />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              전체 선택 / 해제
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[55vh] overflow-y-auto">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`px-4 py-3 transition ${!row.include ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) => setRowField(row.id, 'include', e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-indigo-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Line 1: date + type + amount */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">{row.date}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        row.type === '수입'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {row.type}
                      </span>
                      <span className={`ml-auto text-sm font-bold ${row.type === '수입' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {row.type === '지출' ? '-' : '+'}{row.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Line 2: description */}
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {row.description || row.csvCategory}
                      {row.memo && <span className="ml-1 text-xs text-slate-400">· {row.memo}</span>}
                    </p>

                    {/* Line 3: category + payment selectors */}
                    <div className="flex gap-2">
                      {/* Category selector */}
                      <div className="relative flex-1">
                        <select
                          value={row.categoryId ?? ''}
                          onChange={(e) => setRowField(row.id, 'categoryId', e.target.value || null)}
                          className={`w-full appearance-none rounded-lg border px-2.5 py-1.5 pr-7 text-xs font-medium outline-none transition ${
                            row.categoryId
                              ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          <option value="">카테고리 없음</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      </div>

                      {/* Payment selector */}
                      <div className="relative w-28">
                        <select
                          value={row.payment}
                          onChange={(e) => setRowField(row.id, 'payment', e.target.value as PaymentMethod)}
                          className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 pr-7 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none transition"
                        >
                          {PAYMENT_METHODS.map((pm) => (
                            <option key={pm} value={pm}>{pm}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={includedCount === 0}
          className="btn btn-primary w-full py-4 text-base"
        >
          {includedCount}개 항목 가져오기
        </button>

        <button
          onClick={() => { setStep('upload'); setRows([]) }}
          className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
        >
          <X className="inline h-3.5 w-3.5 mr-1" />
          다시 선택
        </button>
      </div>
    </div>
  )
}
