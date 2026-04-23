import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * @function verify-deposit-payment
 * @description
 * What payment signature verification is:
 * Analogy: Like a tamper-proof seal on a medicine bottle. If the seal is broken or looks 
 * suspicious, you reject the bottle. This ensures the payment data hasn't been faked.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      escrow_id 
    } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verification logic
    // In Deno/Edge functions, we can use Web Crypto API for HMAC
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
    
    // Update escrow record to confirmed
    const { error } = await supabase.from('deposit_escrow')
      .update({ 
        razorpay_payment_id: razorpay_payment_id,
        status: 'held' // Already held, but confirms payment_id
      })
      .eq('id', escrow_id)

    if (error) throw error
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
