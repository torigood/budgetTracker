import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore – npm specifier works in Supabase Edge Functions (Deno)
import webpush from 'npm:web-push@3'

const VAPID_PUBLIC_KEY = 'BCTinJPiMhfhYfyqn5eG2SvwENBDw1AtWB7qbidaeP3ursqoa78_er1CLOv6t4mcVft_JOoyyc08xTQhwrASYvM'

interface PushBody {
  /** if omitted, sends to ALL subscribed users */
  user_id?: string
  title: string
  body: string
  icon?: string
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  webpush.setVapidDetails(
    Deno.env.get('VAPID_EMAIL')!,
    VAPID_PUBLIC_KEY,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  )

  // ── Reminder mode (called by cron, no body) ────────────────────────────────
  const isReminder = req.method === 'POST' && req.headers.get('x-trigger') === 'cron'

  if (isReminder) {
    const today = new Date().toISOString().slice(0, 10)

    // Get all subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    // For each subscribed user, check if they have transactions today
    let sent = 0
    await Promise.allSettled(
      subs.map(async (sub) => {
        const { count } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', sub.user_id)
          .eq('date', today)

        if ((count ?? 0) > 0) return // Already logged today

        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: '오늘 지출 기록하셨나요?',
            body: '가계부를 업데이트하고 지출 습관을 확인해보세요!',
            icon: '/icons/logo512.png',
          })
        )
        sent++
      })
    )

    return new Response(JSON.stringify({ sent }), { status: 200 })
  }

  // ── Manual push (budget / anomaly alerts from client) ─────────────────────
  const payload: PushBody = await req.json()

  let query = supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (payload.user_id) {
    query = query.eq('user_id', payload.user_id)
  }

  const { data: subs, error } = await query
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results = await Promise.allSettled(
    (subs ?? []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: payload.title, body: payload.body, icon: payload.icon ?? '/icons/logo512.png' })
      )
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return new Response(
    JSON.stringify({ sent, failed }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  )
})
