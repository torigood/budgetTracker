import { create } from 'zustand'
import { getCurrentMonth } from '@/utils/format'

interface UIState {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  isDark: boolean
  toggleDark: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
  isDark: localStorage.getItem('theme') === 'dark',
  toggleDark: () => {
    const next = !get().isDark
    set({ isDark: next })
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  },
}))
