import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Razorpay from 'https://esm.sh/razorpay@2'

/**
 * @function create-agreement-payment
 * @description
 * Creates a Razorpay order for a single rent agreement generation.
 * 
 * Why we verify payment on the server:
 * Analogy: Like a tamper-proof seal on a document. We ensure the payment 
 * was officially received before generating the legal agreement.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { landlord_id, agreement_data } = await req.json()
    
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
    })
    
    const order = await razorpay.orders.create({
      amount: 29900, // ₹299.00 in paise
      currency: 'INR',
      receipt: `agreement_${landlord_id}_${Date.now()}`,
      notes: {
        type: 'rent_agreement',
        landlord_id
      }
    })
    
    return new Response(JSON.stringify({
      order_id: order.id,
      amount: order.amount
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
