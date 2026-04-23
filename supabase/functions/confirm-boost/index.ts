import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * @function confirm-boost
 * @description
 * Verifies the Razorpay payment signature and updates the room's boost status.
 * 
 * Why we verify on the server:
 * Analogy: A cashier confirms the card payment on THEIR machine, 
 * not just because the customer says "I paid". This prevents users from 
 * faking successful payments to get premium features for free.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { 
      room_id,
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verification logic using Web Crypto API
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(text);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureArrayBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );

    const expectedSignature = Array.from(new Uint8Array(signatureArrayBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    // Update room boost status (7 days from now)
    const boostedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase.from('rooms')
      .update({ boosted_until: boostedUntil })
      .eq('id', room_id);

    if (error) throw error
    
    return new Response(JSON.stringify({ success: true, boosted_until: boostedUntil }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
