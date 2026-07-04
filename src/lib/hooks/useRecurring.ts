import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { invalidateTransactionData } from '@/lib/hooks/useTransactions'
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

export function useRunRecurringNow() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('로그인이 필요합니다')

      const now = new Date()
      const today = now.getDate()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`
      const startOfMonth = `${yearMonth}-01`
      const daysInMonth = new Date(year, month, 0).getDate()
      const endOfMonth = `${yearMonth}-${String(daysInMonth).padStart(2, '0')}`
      const todayDate = `${yearMonth}-${String(today).padStart(2, '0')}`
      const isLastDayOfMonth = today === daysInMonth

      // 말일에는 이번 달에 없는 날짜(예: 2월의 29~31일)로 설정된 항목도 함께 실행
      let itemsQuery = supabase
        .from('recurring_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      itemsQuery = isLastDayOfMonth
        ? itemsQuery.gte('day_of_month', today)
        : itemsQuery.eq('day_of_month', today)
      const { data: items, error } = await itemsQuery

      if (error) throw error

      let inserted = 0
      let skipped = 0
      let failed = 0
      let expenseInserted = 0
      let incomeInserted = 0

      for (const item of items ?? []) {
        const paymentMethod = item.payment_method === '자동입금' ? '자동입금' : '자동지출'
        const transactionType = paymentMethod === '자동입금' ? '수입' : '지출'
        const autoMemo = paymentMethod === '자동입금' ? '자동입금 자동 생성' : '자동지출 자동 생성'

        const { count, error: countError } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('description', item.description)
          .eq('category_id', item.category_id)
          .eq('payment_method', paymentMethod)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)

        if (countError) {
          failed++
          continue
        }

        if ((count ?? 0) > 0) {
          skipped++
          continue
        }

        const { error: insertError } = await supabase.from('transactions').insert({
          user_id: user.id,
          date: todayDate,
          type: transactionType,
          category_id: item.category_id,
          description: item.description,
          amount: item.amount,
          currency: item.currency ?? 'CAD',
          payment_method: paymentMethod,
          memo: autoMemo,
        })

        if (insertError) {
          failed++
        } else {
          inserted++
          if (paymentMethod === '자동입금') incomeInserted++
          else expenseInserted++
        }
      }

      return { inserted, skipped, failed, total: (items ?? []).length, expenseInserted, incomeInserted }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring'] })
      invalidateTransactionData(queryClient)
    },
  })
}
