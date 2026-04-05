import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type RecurringItem = Database['public']['Tables']['recurring_items']['Row']
export type Receipt = Database['public']['Tables']['receipts']['Row']
export type BudgetLimit = Database['public']['Tables']['budget_limits']['Row']

export type TransactionType = '지출' | '수입'

export type PaymentMethod = '크레딧' | '데빗' | '자동지출' | '현금'

export const PAYMENT_METHODS: PaymentMethod[] = ['크레딧', '데빗', '자동지출', '현금']

export const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#64748b', '#6b7280',
] as const

export interface TransactionFilters {
  month: string // YYYY-MM
  categoryId: string | null
  type: TransactionType | null
  search: string
}

export interface ParsedReceipt {
  date: string | null
  total_amount: number | null
  store_name: string | null
  items: Array<{ name: string; amount: number }>
  payment_method: string | null
  confidence: number
}
