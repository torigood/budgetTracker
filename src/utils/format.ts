const CURRENCY_LOCALE_MAP: Record<string, string> = {
  KRW: 'ko-KR',
  CAD: 'en-CA',
  USD: 'en-US',
  JPY: 'ja-JP',
  EUR: 'de-DE',
  GBP: 'en-GB',
}

export function formatCurrency(amount: number, currency = 'CAD'): string {
  const locale = CURRENCY_LOCALE_MAP[currency] ?? 'en-CA'
  // KRW/JPY are whole-number currencies — no decimals
  const noDecimals = currency === 'KRW' || currency === 'JPY'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function formatDateShort(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(d)
}

export function getRelativeDate(date: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date + 'T00:00:00')
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  return formatDateShort(date)
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${year}년 ${parseInt(m)}월`
}

export function getMonthRange(month: string): { start: string; end: string } {
  const [year, m] = month.split('-').map(Number)
  const start = `${year}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(year, m, 0).getDate()
  const end = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
