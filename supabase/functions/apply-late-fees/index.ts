import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * apply-late-fees Edge Function
 * 
 * WHAT IT DOES: 
 * Scans for unpaid rent entries that are 5+ days past their due date.
 * Calculates a late fee based on the room's configuration (default 5%) 
 * and adds it to the ledger. Sends an automated notice to the tenant via chat.
 * 
 * CRON ANALOGY: Like an automated billing clerk who checks the ledger every morning, 
 * identifies late payers, stamps a late fee on their bill, and sends them a reminder.
 */
serve(async (req) => {
  // Security check: Only allow calls from the service role (pg_cron)
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const today = new Date()
  const fiveDaysAgo = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)
  
  /**
   * QUERY OVERDUE ENTRIES
   * Why late_fee_applied = 0? 
   * Analogy: Like checking if you've already stamped a letter before stamping it again.
   * This prevents us from double-charging the late fee if the cron runs multiple times or 
   * if the user is already penalized.
   */
  const { data: overdueEntries, error: fetchError } = await supabase
    .from('rent_ledger')
    .select(`
      id,
      amount,
      tenant_id,
      landlord_id,
      month,
      due_date,
      late_fee_applied,
      tenants (
        id,
        tenant_profile_id,
        room_id,
        rooms (late_fee_pct, title),
        profiles!tenant_profile_id (full_name, phone)
      )
    `)
    .eq('status', 'unpaid')
    .lte('due_date', fiveDaysAgo.toISOString().split('T')[0])
    .eq('late_fee_applied', 0)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  const results = []
  
  for (const entry of overdueEntries || []) {
    // 1. Calculate late fee (default to 5% if room doesn't have it set)
    const lateFeePct = (entry.tenants as any).rooms?.late_fee_pct || 5
    const lateFee = Math.round(entry.amount * (lateFeePct / 100))
    
    // 2. Update ledger with the late fee
    const { error: updateError } = await supabase
      .from('rent_ledger')
      .update({ late_fee_applied: lateFee })
      .eq('id', entry.id)
    
    if (updateError) continue

    // 3. Send automated notification message via REHWAS Chat
    const tenantProfile = (entry.tenants as any).profiles
    const roomTitle = (entry.tenants as any).rooms?.title
    
    await supabase.from('messages').insert({
      room_id: (entry.tenants as any).room_id,
      sender_id: entry.landlord_id,
      receiver_id: (entry.tenants as any).tenant_profile_id,
      content: `⚠️ Automated Notice: Your rent for ${entry.month} at "${roomTitle}" is overdue by 5 days. A late fee of ₹${lateFee} (${lateFeePct}%) has been applied. Total due: ₹${entry.amount + lateFee}. Please clear your dues on REHWAS.`,
      is_automated: true
    })

    // 4. Also send a notification badge/toast trigger
    await supabase.from('notifications').insert({
      user_id: (entry.tenants as any).tenant_profile_id,
      type: 'late_fee',
      title: 'Late Fee Applied',
      body: `A late fee of ₹${lateFee} was added to your ${entry.month} rent.`,
      link: '/profile'
    })
    
    results.push({ entry_id: entry.id, late_fee: lateFee })
  }
  
  return new Response(JSON.stringify({ 
    processed: results.length, 
    results 
  }), { headers: { 'Content-Type': 'application/json' } })
})
