import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

const enablePasskeys = import.meta.env.VITE_ENABLE_PASSKEYS === 'true'
const supabaseOptions = enablePasskeys
  ? ({ auth: { experimental: { passkey: true } } } as Parameters<typeof createClient>[2])
  : undefined

// Use untyped client; explicit casts per query for safety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions) as any
