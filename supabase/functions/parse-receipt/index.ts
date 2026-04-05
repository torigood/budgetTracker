import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://budget-tracker-f3nf.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function validateParsedReceipt(data: unknown): {
  date: string | null
  total_amount: number | null
  store_name: string | null
  items: Array<{ name: string; amount: number }>
  payment_method: string | null
  confidence: number
} {
  if (typeof data !== 'object' || data === null) throw new Error('AI 응답이 올바른 JSON 형식이 아닙니다')
  const d = data as Record<string, unknown>

  const date = typeof d.date === 'string' ? d.date : null
  const total_amount = typeof d.total_amount === 'number' && isFinite(d.total_amount) ? d.total_amount : null
  const store_name = typeof d.store_name === 'string' ? d.store_name.slice(0, 200) : null
  const payment_method = typeof d.payment_method === 'string' ? d.payment_method.slice(0, 100) : null
  const confidence = typeof d.confidence === 'number' && isFinite(d.confidence)
    ? Math.min(1, Math.max(0, d.confidence))
    : 0

  const rawItems = Array.isArray(d.items) ? d.items : []
  const items = rawItems
    .filter((item): item is { name: string; amount: number } =>
      typeof item === 'object' && item !== null &&
      typeof (item as Record<string, unknown>).name === 'string' &&
      typeof (item as Record<string, unknown>).amount === 'number' &&
      isFinite((item as Record<string, unknown>).amount as number)
    )
    .slice(0, 100)

  return { date, total_amount, store_name, items, payment_method, confidence }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401 })

    // Rate limiting: 하루 20회
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)

    if ((count ?? 0) >= 20) {
      return new Response(
        JSON.stringify({ error: '오늘 파싱 한도(20회)에 도달했습니다' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { storage_path } = await req.json() as { storage_path: string }

    // storage_path 형식 검증: {uuid}/{timestamp}.{ext}
    if (!storage_path || !/^[0-9a-f-]{36}\/\d+\.(jpg|jpeg|png|webp|heic|gif)$/i.test(storage_path)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 파일 경로입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Storage에서 이미지 다운로드
    const { data: imageData, error: storageError } = await supabase.storage
      .from('receipts')
      .download(storage_path)
    if (storageError || !imageData) throw storageError

    const arrayBuffer = await imageData.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const mimeType = storage_path.endsWith('.png') ? 'image/png' : 'image/jpeg'

    // OpenRouter API 호출 (OpenAI 호환 포맷)
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!
    const claudeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://budgettracker.app',
        'X-Title': 'Budget Tracker',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `당신은 영수증 이미지를 분석하는 전문가입니다.
영수증에서 다음 정보를 추출하여 정확히 JSON 형식으로 반환하세요.
날짜가 없으면 null, 금액이 없으면 null로 반환하세요.
응답은 반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

반환 형식:
{
  "date": "YYYY-MM-DD 또는 null",
  "total_amount": 숫자 또는 null,
  "store_name": "상점명 또는 null",
  "items": [{"name": "항목명", "amount": 숫자}],
  "payment_method": "결제수단 또는 null",
  "confidence": 0~1 사이의 신뢰도 숫자
}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              { type: 'text', text: '이 영수증을 분석해주세요.' },
            ],
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      throw new Error(`OpenRouter API error: ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const rawResponse = claudeData.choices[0].message.content
    const parsed = validateParsedReceipt(JSON.parse(rawResponse))

    // receipts 테이블에 저장
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        storage_path,
        store_name: parsed.store_name,
        parsed_date: parsed.date,
        parsed_amount: parsed.total_amount,
        parsed_items: parsed.items,
        raw_response: rawResponse,
        confidence_score: parsed.confidence,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ receipt, parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: '처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
