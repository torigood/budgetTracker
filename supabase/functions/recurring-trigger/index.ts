import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const providedCronSecret = (req.headers.get('x-cron-secret') ?? '').trim()
  const expectedCronSecret = (Deno.env.get('CRON_SECRET') ?? '').trim()

  if (!expectedCronSecret) {
    return new Response(
      JSON.stringify({ error: 'Server misconfigured: missing CRON_SECRET in function env' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!providedCronSecret || providedCronSecret !== expectedCronSecret) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        hint: 'Set identical CRON_SECRET in GitHub Actions secrets and Supabase function secrets.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const today = now.getDate()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // 오늘 날짜에 해당하는 활성 자동 거래 조회(자동지출/자동입금)
  const { data: items, error } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('day_of_month', today)
    .eq('is_active', true)

  if (error) {
    console.error('recurring_items 조회 실패:', error)
    return new Response(JSON.stringify({ error: '처리 중 오류가 발생했습니다' }), { status: 500 })
  }

  let inserted = 0
  let expenseInserted = 0
  let incomeInserted = 0
  let skipped = 0

  for (const item of items ?? []) {
    const paymentMethod = item.payment_method === '자동입금' ? '자동입금' : '자동지출'
    const transactionType = paymentMethod === '자동입금' ? '수입' : '지출'
    const autoMemo = paymentMethod === '자동입금' ? '자동입금 자동 생성' : '자동지출 자동 생성'

    // 중복 방지: 해당 월에 이미 생성된 자동 거래인지 확인
    const startOfMonth = `${yearMonth}-01`
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', item.user_id)
      .eq('description', item.description)
      .eq('category_id', item.category_id)
      .eq('payment_method', paymentMethod)
      .gte('date', startOfMonth)
      .lte('date', `${yearMonth}-31`)

    if ((count ?? 0) > 0) {
      skipped++
      continue
    }

    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: item.user_id,
      date: `${yearMonth}-${String(today).padStart(2, '0')}`,
      type: transactionType,
      category_id: item.category_id,
      description: item.description,
      amount: item.amount,
      currency: item.currency ?? 'CAD',
      payment_method: paymentMethod,
      memo: autoMemo,
    })

    if (insertError) {
      console.error(`자동 거래 생성 실패 (${item.description}):`, insertError)
    } else {
      inserted++
      if (paymentMethod === '자동입금') incomeInserted++
      else expenseInserted++
    }
  }

  return new Response(
    JSON.stringify({ message: '완료', inserted, skipped, expenseInserted, incomeInserted }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
