import { useQuery } from '@tanstack/react-query'
import type { CurrencyCode } from '@/lib/stores/ui.store'
import type { ExchangeRates } from '@/lib/utils/currency'
import { supabase } from '@/lib/supabase'

const CACHE_TTL_MS = 1000 * 60 * 60 * 6
const CACHE_VERSION = 'v2'

function getCacheKey(base: string) {
  return `exchange_rates_${CACHE_VERSION}_${base}`
}

function readCache(base: string): { base: string; rates: Record<string, number>; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(getCacheKey(base))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { base: string; rates: Record<string, number>; fetchedAt: number }
    if (!parsed?.rates || !parsed?.fetchedAt) return null
    if (parsed.base !== base) return null
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(base: string, payload: { base: string; rates: Record<string, number>; fetchedAt: number }) {
  try {
    localStorage.setItem(getCacheKey(base), JSON.stringify(payload))
  } catch {
    // ignore cache write errors
  }
}

async function fetchExchangeRates(base: CurrencyCode) {
  const { data, error } = await supabase.functions.invoke('exchange-rates', {
    body: { base },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data?.rates) {
    throw new Error('Exchange rates response missing rates')
  }

  return {
    base,
    rates: { ...data.rates, [base]: 1 },
    fetchedAt: data.fetchedAt ?? Date.now(),
  } as { base: string; rates: Record<string, number>; fetchedAt: number }
}

export function useExchangeRates(base: CurrencyCode) {
  return useQuery<ExchangeRates & { fetchedAt: number }>({
    queryKey: ['exchange-rates', base],
    enabled: true,
    staleTime: CACHE_TTL_MS,
    queryFn: async () => {
      const cached = readCache(base)
      if (cached) return cached
      const fresh = await fetchExchangeRates(base)
      writeCache(base, fresh)
      return fresh
    },
  })
}
