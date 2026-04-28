import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { tenant_profile_id } = await req.json()

    if (!tenant_profile_id) {
      return new Response(JSON.stringify({ error: 'tenant_profile_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 1. Get all tenant records for this profile
    const { data: tenants, error: tError } = await supabase
      .from('tenants')
      .select('id')
      .eq('tenant_profile_id', tenant_profile_id)

    if (tError) throw tError

    const tenantIds = tenants?.map(t => t.id) || []

    if (tenantIds.length === 0) {
      // Create empty CV if it doesn't exist or update to N/A
      await supabase.from('tenant_cv').upsert({
        tenant_profile_id,
        total_months_tracked: 0,
        paid_on_time_count: 0,
        paid_late_count: 0,
        unpaid_count: 0,
        on_time_payment_pct: 0,
        rent_health_grade: 'N/A',
        last_calculated_at: new Date().toISOString()
      }, { onConflict: 'tenant_profile_id' })

      return new Response(JSON.stringify({ grade: 'N/A', pct: 0, total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Fetch all ledger entries that are due (up to today)
    const { data: allEntries, error: lError } = await supabase
      .from('rent_ledger')
      .select('status, paid_on, due_date')
      .in('tenant_id', tenantIds)
      .lte('due_date', new Date().toISOString().split('T')[0])

    if (lError) throw lError

    const total = allEntries?.length || 0
    
    const onTime = (allEntries || []).filter(e =>
      e.status === 'paid' && 
      e.paid_on && e.due_date && 
      new Date(e.paid_on) <= new Date(e.due_date)
    ).length
    
    const late = (allEntries || []).filter(e =>
      e.status === 'paid' && 
      e.paid_on && e.due_date && 
      new Date(e.paid_on) > new Date(e.due_date)
    ).length
    
    const unpaid = total - onTime - late
    const pct = total > 0 ? Math.round((onTime / total) * 100) : 0
    
    // Grade logic: A (90%+), B (70-89%), C (<70%), N/A (<3 months)
    let grade = 'N/A'
    if (total >= 3) {
      grade = pct >= 90 ? 'A' : pct >= 70 ? 'B' : 'C'
    }
    
    const { error: upsertError } = await supabase.from('tenant_cv').upsert({
      tenant_profile_id,
      total_months_tracked: total,
      paid_on_time_count: onTime,
      paid_late_count: late,
      unpaid_count: unpaid,
      on_time_payment_pct: pct,
      rent_health_grade: grade,
      last_calculated_at: new Date().toISOString()
    }, { onConflict: 'tenant_profile_id' })

    if (upsertError) throw upsertError
    
    return new Response(JSON.stringify({ grade, pct, total, onTime, late, unpaid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
