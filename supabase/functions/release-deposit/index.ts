import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Razorpay from 'https://esm.sh/razorpay@2'

/**
 * @function release-deposit
 * @description
 * What Razorpay Route (Transfers) is:
 * Analogy: Like a "Release of Funds" authorization in a construction project. 
 * The bank only moves the money from the holding account to the contractor's account 
 * after the architect signs off that the roof is built correctly.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { escrow_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!
    })
    
    const { data: escrow, error: fetchError } = await supabase
      .from('deposit_escrow')
      .select('*')
      .eq('id', escrow_id)
      .single()

    if (fetchError || !escrow) throw new Error('Escrow record not found')
    
    // Perform Razorpay Transfer (Route)
    // This moves funds from your account to the landlord's linked account
    const transfer = await razorpay.transfers.create({
      account: Deno.env.get('RAZORPAY_LINKED_ACCOUNT_ID')!,
      amount: escrow.amount * 100,
      currency: 'INR',
      source: escrow.razorpay_payment_id,
      notes: { type: 'deposit_release', escrow_id }
    })
    
    const { error: updateError } = await supabase.from('deposit_escrow')
      .update({ 
        status: 'released',
        razorpay_transfer_id: transfer.id,
        released_at: new Date().toISOString()
      })
      .eq('id', escrow_id)

    if (updateError) throw updateError
    
    return new Response(JSON.stringify({ 
      success: true,
      transfer_id: transfer.id 
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
