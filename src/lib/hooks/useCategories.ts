import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { Category } from '@/types/app'
import type { Database } from '@/types/database'

type CategoryInsert = Database['public']['Tables']['categories']['Insert']

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as Category[]
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Omit<CategoryInsert, 'user_id'>) => {
      const { data: result, error } = await supabase
        .from('categories')
        .insert({ ...data, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryInsert> }) => {
      const { data: result, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return result
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })
}
