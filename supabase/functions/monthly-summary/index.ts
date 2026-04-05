import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const yearMonth = `${year}-${String(month).padStart(2, '0')}`

  const { data: users } = await supabase.auth.admin.listUsers()

  for (const user of users?.users ?? []) {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount, category_id, categories(name, color)')
      .eq('user_id', user.id)
      .gte('date', `${yearMonth}-01`)
      .lte('date', `${yearMonth}-31`)

    const rows = transactions ?? []
    const totalExpense = rows.filter((r) => r.type === '지출').reduce((s, r) => s + r.amount, 0)
    const totalIncome = rows.filter((r) => r.type === '수입').reduce((s, r) => s + r.amount, 0)

    const categoryMap: Record<string, { name: string; color: string; amount: number }> = {}
    rows.filter((r) => r.type === '지출').forEach((r) => {
      const cat = r.categories as { name: string; color: string } | null
      if (!cat || !r.category_id) return
      if (!categoryMap[r.category_id]) categoryMap[r.category_id] = { name: cat.name, color: cat.color, amount: 0 }
      categoryMap[r.category_id].amount += r.amount
    })

    await supabase.from('monthly_summaries').upsert({
      user_id: user.id,
      year,
      month,
      data: { totalExpense, totalIncome, categoryBreakdown: categoryMap },
    }, { onConflict: 'user_id,year,month' })
  }

  return new Response(JSON.stringify({ message: '월별 요약 완료' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
