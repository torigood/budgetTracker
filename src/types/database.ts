export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          display_name: string | null
          currency: string
          created_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          currency?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          currency?: string
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_default: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon: string
          is_default?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          is_default?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          date: string
          type: '지출' | '수입'
          category_id: string
          description: string
          amount: number
          currency: string
          payment_method: string
          memo: string | null
          receipt_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: '지출' | '수입'
          category_id: string
          description: string
          amount: number
          currency?: string
          payment_method: string
          memo?: string | null
          receipt_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: '지출' | '수입'
          category_id?: string
          description?: string
          amount?: number
          currency?: string
          payment_method?: string
          memo?: string | null
          receipt_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_receipt_id_fkey'
            columns: ['receipt_id']
            isOneToOne: false
            referencedRelation: 'receipts'
            referencedColumns: ['id']
          },
        ]
      }
      recurring_items: {
        Row: {
          id: string
          user_id: string
          category_id: string
          description: string
          amount: number
          currency: string
          payment_method: string
          day_of_month: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          description: string
          amount: number
          currency?: string
          payment_method: string
          day_of_month: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          description?: string
          amount?: number
          currency?: string
          payment_method?: string
          day_of_month?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recurring_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          store_name: string | null
          parsed_date: string | null
          parsed_amount: number | null
          parsed_items: Json | null
          raw_response: string | null
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          store_name?: string | null
          parsed_date?: string | null
          parsed_amount?: number | null
          parsed_items?: Json | null
          raw_response?: string | null
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          storage_path?: string
          store_name?: string | null
          parsed_date?: string | null
          parsed_amount?: number | null
          parsed_items?: Json | null
          raw_response?: string | null
          confidence_score?: number | null
          created_at?: string
        }
        Relationships: []
      }
      monthly_summaries: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          month: number
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          year?: number
          month?: number
          data?: Json
          created_at?: string
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          id: string
          user_id: string
          category_id: string
          month: string
          limit_amount: number
          currency: string
          limit_percent: number | null
          limit_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          month: string
          limit_amount: number
          currency: string
          limit_percent?: number | null
          limit_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          month?: string
          limit_amount?: number
          currency?: string
          limit_percent?: number | null
          limit_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'budget_limits_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      monthly_budgets: {
        Row: {
          id: string
          user_id: string
          month: string
          amount: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          amount: number
          currency: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          amount?: number
          currency?: string
          created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
