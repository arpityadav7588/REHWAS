import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Razorpay from 'https://esm.sh/razorpay@2'

/**
 * @function create-boost-payment
 * @description
 * Creates a Razorpay order for a listing boost.
 * 
 * Why we create the order on the server:
 * Analogy: Like a restaurant printing a bill before you pay. The server (waiter) 
 * generates the official amount and order ID so the customer (client) can't 
 * just make up their own price.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { room_id, landlord_id } = await req.json()
    
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
    })
    
    const order = await razorpay.orders.create({
      amount: 19900, // ₹199.00 in paise
      currency: 'INR',
      receipt: `boost_${room_id}_${Date.now()}`,
      notes: {
        type: 'listing_boost',
        room_id,
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
