import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ALLOWED_ORIGINS = [
  'https://budget-tracker-f3nf.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

const SUPPORTED_SYMBOLS = ['KRW', 'CAD', 'USD', 'JPY', 'EUR', 'GBP']

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('EXCHANGERATES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing EXCHANGERATES_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { base } = await req.json().catch(() => ({ base: 'CAD' })) as { base?: string }
    const baseCurrency = (base ?? 'CAD').toUpperCase()

    const baseUrl = Deno.env.get('EXCHANGERATES_API_BASE_URL')
      ?? 'https://api.fastforex.io/fetch-all'

    const url = new URL(baseUrl)
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('from', baseCurrency)

    const res = await fetch(url.toString())
    const rawText = await res.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      data = { raw: rawText }
    }

    if (!res.ok || data?.success === false) {
      return new Response(
        JSON.stringify({
          error: data?.error?.info ?? data?.error?.type ?? 'Exchange rates request failed',
          base: data?.base ?? baseCurrency,
          status: res.status,
          raw: data?.raw,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rates = (data?.results as Record<string, number> | undefined)
      ?? (data?.rates as Record<string, number> | undefined)
      ?? {}

    return new Response(
      JSON.stringify({
        base: (data?.base as string | undefined) ?? baseCurrency,
        rates,
        fetchedAt: data?.updated ? new Date(String(data.updated)).getTime() : Date.now(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
