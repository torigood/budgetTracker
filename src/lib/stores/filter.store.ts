import { create } from 'zustand'
import { getCurrentMonth } from '@/utils/format'
import type { TransactionFilters, TransactionType } from '@/types/app'

interface FilterState {
  filters: TransactionFilters
  setMonth: (month: string) => void
  setCategoryId: (id: string | null) => void
  setType: (type: TransactionType | null) => void
  setSearch: (search: string) => void
  resetFilters: () => void
}

const defaultFilters: TransactionFilters = {
  month: getCurrentMonth(),
  categoryId: null,
  type: null,
  search: '',
}

export const useFilterStore = create<FilterState>((set) => ({
  filters: { ...defaultFilters },
  setMonth: (month) => set((s) => ({ filters: { ...s.filters, month } })),
  setCategoryId: (categoryId) => set((s) => ({ filters: { ...s.filters, categoryId } })),
  setType: (type) => set((s) => ({ filters: { ...s.filters, type } })),
  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}))
