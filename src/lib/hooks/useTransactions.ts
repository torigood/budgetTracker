import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TransactionFilters } from '@/types/app'
import type { Database } from '@/types/database'
import { getMonthRange } from '@/utils/format'

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

const PAGE_SIZE = 20

export function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { start, end } = getMonthRange(filters.month)
      let query = supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1)

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useTransaction(id: string) {
  return useInfiniteQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(id, name, color, icon)')
        .eq('id', id)
        .single()
      if (error) throw error
      return [data]
    },
    getNextPageParam: () => undefined,
    initialPageParam: 0,
    enabled: !!id,
  })
}
