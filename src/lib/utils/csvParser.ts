import type { PaymentMethod, TransactionType } from '@/types/app'

export const PM_MAP: Record<string, PaymentMethod> = {
  '크레딧': '크레딧',
  '데빗': '데빗',
  '이트': '데빗',
  '자동지출': '자동지출',
  '자동 지출': '자동지출',
  'td debit card': '데빗',
  '아마존': '크레딧',
  '현금': '현금',
}

export function normalizePayment(raw: string): PaymentMethod {
  return PM_MAP[raw] ?? PM_MAP[raw.toLowerCase()] ?? '크레딧'
}

export function parseCsvRow(line: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      cols.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur.trim())
  return cols
}

export interface ParsedCsvRow {
  date: string
  type: TransactionType
  csvCategory: string
  description: string
  amount: number
  payment: PaymentMethod
  memo: string
}

export function parseRawRow(cols: string[]): ParsedCsvRow | null {
  if (cols.length < 5) return null

  const date = cols[0]
  const typeRaw = cols[1]
  const csvCategory = cols[2] ?? ''
  const description = cols[3] ?? ''
  const amountRaw = cols[4] ?? '0'
  const paymentRaw = cols[5] ?? ''
  const memo = cols[6] ?? ''

  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return null
  const [y, m, d] = date.split('-').map(Number)
  const parsed = new Date(y, m - 1, d)
  if (parsed.getFullYear() !== y || parsed.getMonth() + 1 !== m || parsed.getDate() !== d) return null

  const amount = parseFloat(amountRaw.replace(/,/g, ''))
  if (!isFinite(amount) || amount <= 0) return null

  return {
    date,
    type: typeRaw === '수입' ? '수입' : '지출',
    csvCategory,
    description,
    amount,
    payment: normalizePayment(paymentRaw),
    memo,
  }
}

export const MAX_CSV_ROWS = 5000
