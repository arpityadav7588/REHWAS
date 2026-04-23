import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Razorpay from 'https://esm.sh/razorpay@2'

/**
 * @function create-subscription
 * @description
 * What a Supabase Edge Function is:
 * Analogy: A mini server that only wakes up when you call it, then goes back to sleep — 
 * like a restaurant waiter who only comes to your table when you wave, instead of standing there all night.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { landlord_id, plan, billing_cycle } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
    })

    const getPlanId = (plan: string, cycle: string) => {
      const key = `RAZORPAY_PLAN_${plan.toUpperCase()}_${cycle.toUpperCase()}`
      return Deno.env.get(key)
    }
    
    const planId = getPlanId(plan, billing_cycle)
    if (!planId) throw new Error(`Plan ID not found for ${plan} ${billing_cycle}`)
    
    // Create Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: billing_cycle === 'annual' ? 1 : 12,
      notes: { landlord_id, plan }
    })
    
    // Upsert local subscription record
    await supabase.from('subscriptions').upsert({
      landlord_id,
      plan,
      razorpay_sub_id: subscription.id,
      razorpay_plan_id: planId,
      status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'landlord_id' })
    
    return new Response(JSON.stringify({
      subscription_id: subscription.id,
      short_url: subscription.short_url
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
