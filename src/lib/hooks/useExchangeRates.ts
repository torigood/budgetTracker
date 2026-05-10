import { useQuery } from '@tanstack/react-query'
import type { CurrencyCode } from '@/lib/stores/ui.store'
import type { ExchangeRates } from '@/lib/utils/currency'

const CACHE_TTL_MS = 1000 * 60 * 60 * 6

function getCacheKey(base: string) {
  return `exchange_rates_v1_${base}`
}

function readCache(base: string): { base: string; rates: Record<string, number>; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(getCacheKey(base))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { base: string; rates: Record<string, number>; fetchedAt: number }
    if (!parsed?.rates || !parsed?.fetchedAt) return null
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
  const apiKey = import.meta.env.VITE_EXCHANGERATES_API_KEY as string | undefined
  if (!apiKey) {
    throw new Error('Missing exchangerates API key')
  }

  const baseUrl = (import.meta.env.VITE_EXCHANGERATES_API_BASE_URL as string | undefined)
    ?? 'https://api.exchangeratesapi.io/v1/latest'

  const symbols = SUPPORTED_CURRENCIES.map((c) => c.code).join(',')
  const url = new URL(baseUrl)
  url.searchParams.set('access_key', apiKey)
  url.searchParams.set('symbols', symbols)
  url.searchParams.set('base', base)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data?.success === false) {
    throw new Error(data?.error?.info ?? 'Exchange rates request failed')
  }

  if (!data?.rates) {
    throw new Error('Exchange rates response missing rates')
  }

  const responseBase = data?.base ?? base
  const fetchedAt = data?.timestamp ? data.timestamp * 1000 : Date.now()

  return {
    base: responseBase,
    rates: data.rates as Record<string, number>,
    fetchedAt,
  }
}

export function useExchangeRates(base: CurrencyCode) {
  const apiKey = import.meta.env.VITE_EXCHANGERATES_API_KEY as string | undefined

  return useQuery<ExchangeRates & { fetchedAt: number }>({
    queryKey: ['exchange-rates', base],
    enabled: Boolean(apiKey),
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
