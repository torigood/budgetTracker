import { create } from 'zustand'
import { getCurrentMonth } from '@/utils/format'
import type { Lang } from '@/lib/i18n'

export const SUPPORTED_CURRENCIES = [
  { code: 'KRW', label: '원화 (₩)',        labelEn: 'Korean Won (₩)',    locale: 'ko-KR' },
  { code: 'CAD', label: '캐나다 달러 (CA$)', labelEn: 'Canadian Dollar (CA$)', locale: 'en-CA' },
  { code: 'USD', label: '미국 달러 ($)',     labelEn: 'US Dollar ($)',     locale: 'en-US' },
  { code: 'JPY', label: '일본 엔 (¥)',       labelEn: 'Japanese Yen (¥)', locale: 'ja-JP' },
  { code: 'EUR', label: '유로 (€)',          labelEn: 'Euro (€)',          locale: 'de-DE' },
  { code: 'GBP', label: '파운드 (£)',        labelEn: 'Pound Sterling (£)', locale: 'en-GB' },
] as const

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code']

interface UIState {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  isDark: boolean
  toggleDark: () => void
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  lang: Lang
  setLang: (l: Lang) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),

  isDark: localStorage.getItem('theme')
    ? localStorage.getItem('theme') === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDark: () => {
    const next = !get().isDark
    set({ isDark: next })
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  },

  currency: (localStorage.getItem('currency') as CurrencyCode) ?? 'CAD',
  setCurrency: (c) => {
    set({ currency: c })
    localStorage.setItem('currency', c)
  },

  lang: (localStorage.getItem('lang') as Lang) ?? 'ko',
  setLang: (l) => {
    set({ lang: l })
    localStorage.setItem('lang', l)
    document.documentElement.lang = l
  },
}))
