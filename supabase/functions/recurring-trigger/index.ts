import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const today = now.getDate()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // 오늘 날짜에 해당하는 활성 자동지출 조회
  const { data: items, error } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('day_of_month', today)
    .eq('is_active', true)

  if (error) {
    console.error('recurring_items 조회 실패:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let inserted = 0
  let skipped = 0

  for (const item of items ?? []) {
    // 중복 방지: 해당 월에 이미 생성된 자동지출인지 확인
    const startOfMonth = `${yearMonth}-01`
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', item.user_id)
      .eq('description', item.description)
      .eq('category_id', item.category_id)
      .eq('payment_method', '자동지출')
      .gte('date', startOfMonth)
      .lte('date', `${yearMonth}-31`)

    if ((count ?? 0) > 0) {
      skipped++
      continue
    }

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: item.user_id,
      date: `${yearMonth}-${String(today).padStart(2, '0')}`,
      type: '지출',
      category_id: item.category_id,
      description: item.description,
      amount: item.amount,
      currency: 'CAD',
      payment_method: '자동지출',
      memo: '자동지출 자동 생성',
    })

    if (insertError) {
      console.error(`자동지출 생성 실패 (${item.description}):`, insertError)
    } else {
      inserted++
    }
  }

  return new Response(
    JSON.stringify({ message: '완료', inserted, skipped }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
