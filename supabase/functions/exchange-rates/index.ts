import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ALLOWED_ORIGINS = [
  'https://budget-tracker-f3nf.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

const SUPPORTED_SYMBOLS = ['KRW', 'CAD', 'USD', 'JPY', 'EUR', 'GBP']

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const isAllowedOrigin =
    ALLOWED_ORIGINS.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)

  const allowedOrigin = isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const requestedBaseCurrency = (base ?? 'CAD').toUpperCase()
    const baseCurrency = SUPPORTED_SYMBOLS.includes(requestedBaseCurrency) ? requestedBaseCurrency : 'CAD'

    const baseUrl = Deno.env.get('EXCHANGERATES_API_BASE_URL')
      ?? 'https://v6.exchangerate-api.com/v6'
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/${apiKey}/latest/${baseCurrency}`)

    const res = await fetch(url.toString())
    const rawText = await res.text()
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      data = { raw: rawText }
    }

    if (!res.ok || data?.result === 'error') {
      return new Response(
        JSON.stringify({
          error: data?.['error-type'] ?? 'Exchange rates request failed',
          base: data?.base_code ?? baseCurrency,
          status: res.status,
          raw: data?.raw,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rates = (data?.conversion_rates as Record<string, number> | undefined)
      ?? (data?.rates as Record<string, number> | undefined)
      ?? {}

    return new Response(
      JSON.stringify({
        base: baseCurrency,
        rates: { ...rates, [baseCurrency]: 1 },
        fetchedAt: typeof data?.time_last_update_unix === 'number'
          ? data.time_last_update_unix * 1000
          : Date.now(),
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
