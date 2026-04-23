import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * @function razorpay-webhook
 * @description
 * What a webhook is:
 * Analogy: Instead of you calling the bank every hour to check if money arrived, 
 * the bank calls YOU the moment it does. It's a "Push" notification for servers.
 * 
 * Why we verify the webhook signature:
 * Analogy: Like checking the caller ID or asking for a secret password before 
 * opening the door to a delivery person. It ensures the message actually came from Razorpay.
 */
serve(async (req) => {
  const signature = req.headers.get('X-Razorpay-Signature')
  const body = await req.text()
  
  // Verification using Web Crypto API
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);

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

  const expectedSig = Array.from(new Uint8Array(signatureArrayBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  if (signature !== expectedSig) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const event = JSON.parse(body)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  /**
   * subscription.activated vs subscription.charged:
   * Analogy: Activated = You just got your premium membership card (access granted).
   * Charged = The club just took the monthly fee from your bank account (payment successful).
   */
  switch (event.event) {
    case 'subscription.activated':
      await supabase.from('subscriptions').update({
        status: 'active',
        current_period_start: new Date(event.payload.subscription.entity.current_start * 1000).toISOString(),
        current_period_end: new Date(event.payload.subscription.entity.current_end * 1000).toISOString()
      }).eq('razorpay_sub_id', event.payload.subscription.entity.id)
      
      const plan = event.payload.subscription.entity.notes.plan
      await supabase.from('profiles').update({ plan })
        .eq('id', event.payload.subscription.entity.notes.landlord_id)
      break
      
    case 'subscription.charged':
      await supabase.from('subscriptions').update({
        status: 'active',
        current_period_end: new Date(event.payload.subscription.entity.current_end * 1000).toISOString()
      }).eq('razorpay_sub_id', event.payload.subscription.entity.id)
      break
      
    case 'subscription.cancelled':
    case 'subscription.completed':
      const sub = await supabase.from('subscriptions')
        .select('landlord_id')
        .eq('razorpay_sub_id', event.payload.subscription.entity.id)
        .single()

      await supabase.from('subscriptions').update({ status: 'cancelled' })
        .eq('razorpay_sub_id', event.payload.subscription.entity.id)
      
      if (sub.data) {
        await supabase.from('profiles').update({ plan: 'starter' })
          .eq('id', sub.data.landlord_id)
      }
      break
      
    case 'payment.failed':
      await supabase.from('subscriptions').update({ status: 'past_due' })
        .eq('razorpay_sub_id', event.payload.payment.entity.description)
      break
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
