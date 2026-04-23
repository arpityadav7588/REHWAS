import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Supabase Edge Function: apply-late-fees
 * 
 * WHAT IT DOES: Finds all unpaid rent entries that are 5+ days past due and 
 * automatically appends a late fee.
 * 
 * ANALOGY: Like setting a recurring alarm inside your database's own brain (pg_cron) — 
 * it wakes up at 10 AM every day without any external trigger.
 * 
 * 5 DAYS GRACE PERIOD: Like a credit card's grace period — gives tenants a few 
 * days to pay before the penalty kicks in, which is standard industry practice in India.
 */
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const today = new Date().toISOString().split('T')[0]
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  const { data: overdueEntries, error } = await supabase
    .from('rent_ledger')
    .select(`
      id,
      tenant_id,
      landlord_id,
      amount,
      month,
      due_date,
      late_fee_percentage,
      tenants (
        id,
        room_id,
        tenant_profile_id,
        rooms ( title, late_fee_percentage )
      )
    `)
    .eq('status', 'unpaid')
    .eq('late_fee_applied', 0)
    .lte('due_date', fiveDaysAgo)
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results = []
  
  for (const entry of overdueEntries || []) {
    /**
     * WHY WE CHECK late_fee_applied === 0:
     * ANALOGY: Checking if a stamp is already on the letter before stamping it 
     * again — prevents double-charging.
     */
    
    // Use room-level late fee % if set, otherwise fall back to ledger-level
    const lateFeePercent =
      entry.tenants?.rooms?.late_fee_percentage ??
      entry.late_fee_percentage ??
      5
    
    const lateFeeAmount = Math.round((entry.amount * lateFeePercent) / 100)
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(entry.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    await supabase
      .from('rent_ledger')
      .update({
        late_fee_applied: lateFeeAmount,
        late_fee_applied_at: new Date().toISOString()
      })
      .eq('id', entry.id)
    
    // Notify tenant via in-app message
    await supabase.from('messages').insert({
      room_id: entry.tenants.room_id,
      sender_id: entry.landlord_id,
      receiver_id: entry.tenants.tenant_profile_id,
      content: `⚠️ Late Fee Notice — ${entry.month}\n\nYour rent of ₹${entry.amount.toLocaleString('en-IN')} was due on ${entry.due_date} and is now ${daysOverdue} days overdue.\n\nA late fee of ₹${lateFeeAmount.toLocaleString('en-IN')} (${lateFeePercent}%) has been applied.\n\nTotal now due: ₹${(entry.amount + lateFeeAmount).toLocaleString('en-IN')}\n\nPlease pay as soon as possible. — REHWAS`
    })
    
    results.push({
      ledger_id: entry.id,
      days_overdue: daysOverdue,
      late_fee_applied: lateFeeAmount
    })
  }
  
  return new Response(JSON.stringify({
    processed: results.length,
    timestamp: new Date().toISOString(),
    results
  }), { status: 200 })
})
