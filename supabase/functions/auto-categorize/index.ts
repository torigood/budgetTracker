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

// 규칙 기반 매핑
const RULE_MAP: Record<string, string> = {
  fido: '통신비', rogers: '통신비', bell: '통신비', telus: '통신비', koodo: '통신비',
  spotify: '취미/여가', netflix: '취미/여가', youtube: '취미/여가', apple: '취미/여가',
  'tim hortons': '식비', 'tims': '식비', starbucks: '식비', mcdonalds: '식비',
  'mcdonald': '식비', subway: '식비', 'a&w': '식비',
  't&t': '식비', loblaws: '식비', costco: '생활비', walmart: '생활비',
  shoppers: '생활비', london: '생활비',
  uber: '교통', lyft: '교통', presto: '교통', ttc: '교통',
  hydro: '생활비', enbridge: '주거', rent: '주거',
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { description } = await req.json() as { description: string }
    const lower = description.toLowerCase()

    // 1차: 규칙 기반
    for (const [keyword, categoryName] of Object.entries(RULE_MAP)) {
      if (lower.includes(keyword)) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('name', categoryName)
          .single()
        if (cat) return new Response(JSON.stringify({ category_id: cat.id, category_name: cat.name, method: 'rule' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 2차: 패턴 학습 (최근 30일 동일 description)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: similar } = await supabase
      .from('transactions')
      .select('category_id, categories(name)')
      .eq('user_id', user.id)
      .ilike('description', `%${description}%`)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    if (similar && similar.length > 0) {
      const most = similar[0]
      return new Response(
        JSON.stringify({ category_id: most.category_id, method: 'pattern' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3차: OpenRouter API (저렴한 haiku 모델 사용)
    const { data: allCats } = await supabase.from('categories').select('id, name').eq('user_id', user.id)
    const catList = allCats?.map((c) => c.name).join(', ') ?? ''

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')!
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://budgettracker.app',
        'X-Title': 'Budget Tracker',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `거래 내용: "${description}"\n카테고리 목록: ${catList}\n\n위 거래에 가장 적합한 카테고리 이름 하나만 정확히 반환하세요. 다른 텍스트는 포함하지 마세요.`,
        }],
      }),
    })

    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const suggestedName = data.choices[0].message.content.trim()
    const matched = allCats?.find((c) => c.name === suggestedName)

    return new Response(
      JSON.stringify({ category_id: matched?.id ?? null, category_name: suggestedName, method: 'ai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: '처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
