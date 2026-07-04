import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TransactionFilters } from '@/types/app'
import type { Database } from '@/types/database'
import { getMonthRange } from '@/utils/format'

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

const PAGE_SIZE = 20

// 거래 데이터에서 파생되는 모든 쿼리 키 — 거래가 바뀌면 전부 무효화해야 한다
const TRANSACTION_DERIVED_KEYS = [
  'transactions',
  'transaction',
  'dashboard',
  'analytics',
  'calendar',
  'widget-stats',
  'annual',
  'prev-month-summary',
] as const

export function invalidateTransactionData(queryClient: QueryClient) {
  for (const key of TRANSACTION_DERIVED_KEYS) {
    void queryClient.invalidateQueries({ queryKey: [key] })
  }
}

export function useTransactions(filters: TransactionFilters, searchAll = false) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters, searchAll],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .order('date', { ascending: filters.sortOrder === 'asc' })
        .order('created_at', { ascending: filters.sortOrder === 'asc' })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

      // Month filter — skipped when searching all time
      if (!searchAll) {
        const { start, end } = getMonthRange(filters.month)
        query = query.gte('date', start).lte('date', end)
      }

      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.type) query = query.eq('type', filters.type)
      if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,memo.ilike.%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateTransactionData(queryClient),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: TransactionInsert) => {
      const { data: result, error } = await supabase
        .from('transactions')
        .insert(data)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => invalidateTransactionData(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionInsert> }) => {
      const { data: result, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => invalidateTransactionData(queryClient),
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
