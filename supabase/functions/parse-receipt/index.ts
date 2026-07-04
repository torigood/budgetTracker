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

  const toNumber = (value: unknown) => {
    if (typeof value === 'number' && isFinite(value)) return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]/g, '')
      const n = Number(cleaned)
      if (isFinite(n)) return n
    }
    return null
  }

  const date = typeof d.date === 'string' ? d.date : null
  const total_amount = toNumber(d.total_amount)
  const store_name = typeof d.store_name === 'string' ? d.store_name.slice(0, 200) : null
  const payment_method = typeof d.payment_method === 'string' ? d.payment_method.slice(0, 100) : null
  const confidence = typeof d.confidence === 'number' && isFinite(d.confidence)
    ? Math.min(1, Math.max(0, d.confidence))
    : 0

  const rawItems = Array.isArray(d.items) ? d.items : []
  const items = rawItems
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const obj = item as Record<string, unknown>

      const name = typeof obj.name === 'string'
        ? obj.name
        : (typeof obj.item === 'string' ? obj.item : (typeof obj.description === 'string' ? obj.description : ''))

      const amount = toNumber(obj.amount ?? obj.price ?? obj.total)
      if (!name || amount === null) return null

      return { name: name.slice(0, 200), amount }
    })
    .filter((item): item is { name: string; amount: number } => item !== null)
    .slice(0, 100)

  return { date, total_amount, store_name, items, payment_method, confidence }
}

function extractJsonText(raw: string) {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1)

  throw new Error('AI 응답에서 JSON을 찾을 수 없습니다')
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function extractOpenRouterText(content: unknown) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (typeof part === 'object' && part !== null && typeof (part as Record<string, unknown>).text === 'string') {
        return (part as Record<string, unknown>).text as string
      }
      return ''
    })
    .join('\n')
    .trim()
}

function toIsoDate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month - 1, day))
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysDiff(a: string, b: string) {
  const da = new Date(`${a}T00:00:00Z`).getTime()
  const db = new Date(`${b}T00:00:00Z`).getTime()
  return Math.round((da - db) / (1000 * 60 * 60 * 24))
}

function chooseMostLikelyDate(candidates: string[], currentDate?: string) {
  if (candidates.length === 0) return null
  if (!currentDate) return candidates[0]

  const sorted = [...new Set(candidates)].sort((a, b) => {
    const da = daysDiff(a, currentDate)
    const db = daysDiff(b, currentDate)

    // Prefer not-too-far future dates for receipts.
    const scoreA = Math.abs(da) + (da > 30 ? 1000 : 0)
    const scoreB = Math.abs(db) + (db > 30 ? 1000 : 0)
    return scoreA - scoreB
  })

  return sorted[0]
}

function normalizeParsedDate(raw: string | null, preference: 'DMY' | 'MDY', currentDate?: string) {
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    return toIsoDate(y, m, d)
  }

  const slash = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!slash) return raw

  const a = Number(slash[1])
  const b = Number(slash[2])
  const yRaw = Number(slash[3])
  const year = yRaw < 100 ? 2000 + yRaw : yRaw

  const candidates: string[] = []

  if (a > 12 && b <= 12) {
    const c = toIsoDate(year, b, a)
    if (c) candidates.push(c)
  } else if (b > 12 && a <= 12) {
    const c = toIsoDate(year, a, b)
    if (c) candidates.push(c)
  } else {
    const dmy = toIsoDate(year, b, a)
    const mdy = toIsoDate(year, a, b)
    if (preference === 'DMY') {
      if (dmy) candidates.push(dmy)
      if (mdy) candidates.push(mdy)
    } else {
      if (mdy) candidates.push(mdy)
      if (dmy) candidates.push(dmy)
    }
  }

  return chooseMostLikelyDate(candidates, currentDate)
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증 토큰이 없습니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: `로그인 세션이 유효하지 않습니다: ${authError?.message ?? 'user not found'}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const { storage_path, date_preference, current_date, locale, timezone } = await req.json() as {
      storage_path: string
      date_preference?: 'DMY' | 'MDY'
      current_date?: string
      locale?: string
      timezone?: string
    }

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
    const base64 = arrayBufferToBase64(arrayBuffer)
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
}

날짜 규칙:
- 날짜는 반드시 YYYY-MM-DD로 반환하세요.
- 만약 영수증 날짜가 08/04/26처럼 모호하면 ${date_preference === 'MDY' ? '월/일/년(MDY)' : '일/월/년(DMY)'} 우선으로 해석하세요.
- 영수증 주소/상점 국가 힌트가 보이면 그 국가 날짜 관행을 참고하세요.
- 현재 날짜는 ${current_date ?? 'unknown'} 이고, locale은 ${locale ?? 'unknown'}, timezone은 ${timezone ?? 'unknown'} 입니다.
- 영수증 날짜는 보통 현재 날짜와 아주 멀지 않다는 점을 반영하세요.
`,
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
      choices?: Array<{ message?: { content?: unknown } }>
    }
    const rawResponse = extractOpenRouterText(claudeData.choices?.[0]?.message?.content)
    if (!rawResponse) {
      throw new Error('AI 응답 형식이 예상과 다릅니다')
    }
    const parsed = validateParsedReceipt(JSON.parse(extractJsonText(rawResponse)))
    const normalizedDate = normalizeParsedDate(
      parsed.date,
      date_preference === 'MDY' ? 'MDY' : 'DMY',
      current_date
    )

    // receipts 테이블에 저장
    const { data: receipt, error: insertError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        storage_path,
        store_name: parsed.store_name,
        parsed_date: normalizedDate,
        parsed_amount: parsed.total_amount,
        parsed_items: parsed.items,
        raw_response: rawResponse,
        confidence_score: parsed.confidence,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ receipt, parsed: { ...parsed, date: normalizedDate } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
