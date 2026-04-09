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

export function formatCompactAmount(amount: number, currency = 'CAD'): string {
  const locale = CURRENCY_LOCALE_MAP[currency] ?? 'en-CA'
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatCompactCurrency(amount: number, currency = 'CAD'): string {
  const locale = CURRENCY_LOCALE_MAP[currency] ?? 'en-CA'
  const noDecimals = currency === 'KRW' || currency === 'JPY'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: noDecimals ? 0 : 1,
    maximumFractionDigits: noDecimals ? 0 : 1,
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

export function formatDateShort(date: string, lang: 'ko' | 'en' = 'ko'): string {
  const d = new Date(date + 'T00:00:00')
  const locale = lang === 'ko' ? 'ko-KR' : 'en-US'
  return new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).format(d)
}

export function getRelativeDate(date: string, lang: 'ko' | 'en' = 'ko'): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date + 'T00:00:00')
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return lang === 'ko' ? '오늘' : 'Today'
  if (diff === 1) return lang === 'ko' ? '어제' : 'Yesterday'
  return formatDateShort(date, lang)
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${year}년 ${parseInt(m)}월`
}

/** Locale-aware "2025년 3월" / "March 2025" */
export function getMonthLabelLocale(month: string, lang: string): string {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  const locale = lang === 'ko' ? 'ko-KR' : 'en-US'
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date)
}

/** Short axis label: "3월" / "Mar" */
export function getMonthShortLabel(month: string, lang: string): string {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  const locale = lang === 'ko' ? 'ko-KR' : 'en-US'
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date)
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
