import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Razorpay from 'https://esm.sh/razorpay@2'

/**
 * @function create-deposit-order
 * @description 
 * What a Supabase Edge Function is: 
 * Analogy: A mini server that only wakes up when you call it, then goes back to sleep — 
 * like a restaurant waiter who only comes to your table when you wave, instead of standing there all night.
 * 
 * What Razorpay Route is:
 * Analogy: Like an ESCROW service where a bank holds funds between a buyer and seller 
 * during a property deal. The money is "locked" until both parties fulfill their contract.
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { tenant_id, landlord_id, room_id, amount } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
    })
    
    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `deposit_${room_id}_${Date.now()}`,
      notes: {
        type: 'deposit_vault',
        tenant_id,
        landlord_id,
        room_id
      }
    })
    
    // Insert pending escrow record
    const { data: escrow, error } = await supabase.from('deposit_escrow').insert({
      tenant_id,
      landlord_id,
      room_id,
      amount,
      status: 'held',
      razorpay_payment_id: order.id // Initially store order ID, will update with payment ID on verification
    }).select().single()

    if (error) throw error
    
    return new Response(JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      escrow_id: escrow.id
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
