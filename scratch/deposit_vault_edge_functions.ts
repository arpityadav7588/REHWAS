/**
 * REHWAS EDGE FUNCTIONS: Deposit Vault (Razorpay Route)
 * 
 * 1. create-deposit-order: Creates a Razorpay order and pending escrow record.
 * 2. verify-deposit-payment: Verifies the payment signature and locks funds in 'held' state.
 * 3. release-deposit: Transfers funds from REHWAS to Landlord after report signing.
 */

// --- 1. create-deposit-order/index.ts ---
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Razorpay from 'https://esm.sh/razorpay@2'

serve(async (req) => {
  const { tenant_id, landlord_id, room_id, amount } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
  })
  
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: `deposit_${room_id}_${Date.now()}`,
    notes: { type: 'deposit_vault', tenant_id, landlord_id, room_id }
  })
  
  const { data: escrow } = await supabase
    .from('deposit_escrow')
    .insert({
      tenant_id, landlord_id, room_id,
      amount, status: 'pending',
      razorpay_order_id: order.id
    })
    .select()
    .single()
  
  return new Response(JSON.stringify({
    order_id: order.id,
    escrow_id: escrow.id,
    amount: order.amount,
    currency: 'INR',
    key: Deno.env.get('RAZORPAY_KEY_ID')
  }), { headers: { "Content-Type": "application/json" } })
})


// --- 2. verify-deposit-payment/index.ts ---
serve(async (req) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    escrow_id
  } = await req.json()
  
  const crypto = await import('node:crypto')
  const expectedSig = crypto
    .createHmac('sha256', Deno.env.get('RAZORPAY_KEY_SECRET')!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  
  if (expectedSig !== razorpay_signature) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }
  
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  
  await supabase
    .from('deposit_escrow')
    .update({
      razorpay_payment_id,
      status: 'held'
    })
    .eq('id', escrow_id)
  
  return new Response(JSON.stringify({ success: true, status: 'held' }), {
    headers: { "Content-Type": "application/json" },
  })
})


// --- 3. release-deposit/index.ts ---
serve(async (req) => {
  const { escrow_id } = await req.json()
  
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
  })

  const { data: escrow } = await supabase
    .from('deposit_escrow')
    .select('*')
    .eq('id', escrow_id)
    .single()
  
  if (escrow.status !== 'held') {
    return new Response(JSON.stringify({ error: 'Deposit not in held state' }), { status: 400 })
  }
  
  // Verify move-in report is signed by both
  const { data: report } = await supabase
    .from('move_in_reports')
    .select('landlord_signed_at, tenant_signed_at')
    .eq('room_id', escrow.room_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!report?.landlord_signed_at || !report?.tenant_signed_at) {
    return new Response(JSON.stringify({
      error: 'Move-in report not signed by both parties'
    }), { status: 400 })
  }
  
  const transfer = await razorpay.transfers.create({
    account: Deno.env.get('RAZORPAY_LINKED_ACCOUNT_ID')!,
    amount: escrow.amount * 100,
    currency: 'INR',
    source: escrow.razorpay_payment_id,
    notes: { type: 'deposit_release', escrow_id }
  })
  
  await supabase
    .from('deposit_escrow')
    .update({
      status: 'released',
      razorpay_transfer_id: transfer.id,
      released_at: new Date().toISOString()
    })
    .eq('id', escrow_id)
  
  return new Response(JSON.stringify({ transfer_id: transfer.id }), {
    headers: { "Content-Type": "application/json" },
  })
})
