import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * WHAT IT DOES: Generates a weekly summary of unpaid rent for each landlord 
 * and stores it as a notification.
 * 
 * CRON SCHEDULE '0 18 * * 5':
 * ANALOGY: Like a calendar reminder that says "every Friday at 6 PM".
 * The '5' means Friday in Unix cron (0=Sun, 1=Mon... 5=Fri).
 * '0 18' means 18:00 (6:00 PM).
 */
serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get all landlords
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  const { data: landlords, error: landlordError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('role', 'landlord')
  
  if (landlordError) return new Response(JSON.stringify({ error: landlordError.message }), { status: 500 })

  const notificationsSent = []
  
  for (const landlord of landlords || []) {
    const { data: unpaidEntries } = await supabase
      .from('rent_ledger')
      .select(`
        id,
        amount,
        late_fee_applied,
        month,
        tenant_id,
        tenants (
          id,
          room_id,
          rent_amount,
          profiles!tenant_profile_id ( full_name, phone ),
          rooms ( title, locality )
        )
      `)
      .eq('landlord_id', landlord.id)
      .eq('status', 'unpaid')
      .eq('month', currentMonth)
    
    if (!unpaidEntries || unpaidEntries.length === 0) continue
    
    const totalOwed = unpaidEntries.reduce((sum, e) =>
      sum + e.amount + (e.late_fee_applied || 0), 0)
    
    // Build WhatsApp deep link for each unpaid tenant
    const tenantLinks = unpaidEntries.map(entry => {
      const tenant = entry.tenants
      const tenantName = tenant?.profiles?.full_name || 'Tenant'
      const tenantPhone = tenant?.profiles?.phone || ''
      const roomTitle = tenant?.rooms?.title || 'your room'
      const totalDue = entry.amount + (entry.late_fee_applied || 0)
      
      const message = encodeURIComponent(
        `Hi ${tenantName}, your rent of ₹${totalDue.toLocaleString('en-IN')} for ${entry.month} is pending.\n\n` +
        `Room: ${roomTitle}\n` +
        `Please pay at your earliest convenience.\n\n` +
        `— ${landlord.full_name} via REHWAS 🏠`
      )
      
      return {
        tenant_name: tenantName,
        amount_due: totalDue,
        room_title: roomTitle,
        whatsapp_link: `https://wa.me/91${tenantPhone.replace(/\D/g, '').slice(-10)}?text=${message}`
      }
    })
    
    // Store notification record in Supabase
    const notificationMetadata = {
      type: 'weekly_arrears',
      total_unpaid_tenants: unpaidEntries.length,
      total_amount_owed: totalOwed,
      month: currentMonth,
      tenant_links: tenantLinks
    }
    
    await supabase.from('landlord_notifications').insert({
      landlord_id: landlord.id,
      type: 'weekly_arrears_report',
      title: `${unpaidEntries.length} tenants owe you ₹${totalOwed.toLocaleString('en-IN')}`,
      body: `Send automated reminders in 1 click.`,
      metadata: notificationMetadata,
      is_read: false,
      created_at: new Date().toISOString()
    })
    
    notificationsSent.push({
      landlord_id: landlord.id,
      unpaid_count: unpaidEntries.length,
      total_owed: totalOwed
    })
  }
  
  return new Response(JSON.stringify({
    processed: notificationsSent.length,
    timestamp: new Date().toISOString(),
    details: notificationsSent
  }), { status: 200 })
})
