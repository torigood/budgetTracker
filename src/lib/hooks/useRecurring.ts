import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { RecurringItem } from '@/types/app'
import type { Database } from '@/types/database'

type RecurringInsert = Database['public']['Tables']['recurring_items']['Insert']
export type RecurringWithCategory = RecurringItem & {
  categories: { id: string; name: string; color: string; icon: string } | null
}

export function useRecurringItems() {
  return useQuery<RecurringWithCategory[]>({
    queryKey: ['recurring'],
    queryFn: async (): Promise<RecurringWithCategory[]> => {
      const { data, error } = await supabase
        .from('recurring_items')
        .select('*, categories(id, name, color, icon)')
        .order('day_of_month', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as RecurringWithCategory[]
    },
  })
}

export function useCreateRecurring() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Omit<RecurringInsert, 'user_id'>) => {
      const { data: result, error } = await supabase
        .from('recurring_items')
        .insert({ ...data, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RecurringInsert> }) => {
      const { data: result, error } = await supabase
        .from('recurring_items')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['recurring'] }),
  })
}
