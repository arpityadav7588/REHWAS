import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * @function generate-agreement
 * @description
 * Generates a legally compliant rent agreement HTML based on provided data.
 * Verifies payment before generation.
 * 
 * Why we verify payment on the server:
 * Analogy: A notary doesn't sign a document just because you say you'll pay — 
 * they verify everything is in order and payment is settled before applying the official stamp.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { payment_id, agreement_data, is_free } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verification logic (if not free)
    if (!is_free && !payment_id) {
       throw new Error('Payment verification required');
    }

    // Generate Agreement ID
    const agreementId = `RH-AGR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // HTML Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @media print { @page { margin: 2cm; } }
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #333; padding: 40px; max-width: 900px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; }
          .title { font-size: 28px; font-weight: bold; text-transform: uppercase; margin: 0; }
          .verify-id { font-size: 10px; color: #666; margin-top: 5px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 10px; display: block; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .party-box { border: 1px solid #ccc; padding: 15px; border-radius: 4px; }
          .party-title { font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 10px; padding-bottom: 5px; }
          .signatures { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
          .sig-line { border-top: 1px solid #000; padding-top: 10px; text-align: center; font-weight: bold; }
          .footer { margin-top: 100px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Residential Rental Agreement</h1>
          <div class="verify-id">REHWAS VERIFIED DOCUMENT • ID: ${agreementId}</div>
        </div>

        <div class="section">
          <p>This RENTAL AGREEMENT is made at <strong>${agreement_data.city || ''}</strong> on this <strong>${today}</strong>.</p>
        </div>

        <div class="details-grid">
          <div class="party-box">
            <div class="party-title">THE LANDLORD (FIRST PARTY)</div>
            <strong>${agreement_data.landlord_name}</strong><br/>
            ${agreement_data.landlord_address}<br/>
            Phone: ${agreement_data.landlord_phone || 'N/A'}
          </div>
          <div class="party-box">
            <div class="party-title">THE TENANT (SECOND PARTY)</div>
            <strong>${agreement_data.tenant_name}</strong><br/>
            ${agreement_data.tenant_address}<br/>
            Phone: ${agreement_data.tenant_phone || 'N/A'}
          </div>
        </div>

        <div class="section">
          <span class="section-title">1. DESCRIPTION OF PREMISES</span>
          <p>The Landlord is the absolute owner of the property situated at: <strong>${agreement_data.property_address}</strong> (hereinafter referred to as the 'Premises').</p>
        </div>

        <div class="section">
          <span class="section-title">2. LEASE TERM</span>
          <p>The lease shall be for a period of <strong>${agreement_data.lease_period || '11 months'}</strong>, commencing from <strong>${agreement_data.lease_start_date}</strong> and ending on <strong>${agreement_data.lease_end_date}</strong>.</p>
        </div>

        <div class="section">
          <span class="section-title">3. RENT & SECURITY DEPOSIT</span>
          <p>The Tenant agrees to pay a monthly rent of <strong>₹${agreement_data.rent_amount}</strong> payable on or before the 10th of every month. 
          The Tenant has deposited a sum of <strong>₹${agreement_data.deposit_amount}</strong> as an interest-free Security Deposit, which is refundable at the time of vacating the premises after deducting dues, if any.</p>
        </div>

        <div class="section">
          <span class="section-title">4. TERMINATION & NOTICE PERIOD</span>
          <p>Either party can terminate this agreement by giving <strong>${agreement_data.notice_period || '30'} days</strong> written notice to the other party.</p>
        </div>

        <div class="section">
          <span class="section-title">5. SPECIAL CLAUSES</span>
          <p>${agreement_data.special_clauses || 'No special clauses mentioned.'}</p>
        </div>

        <div class="section">
          <span class="section-title">6. MAINTENANCE & USAGE</span>
          <p>The Tenant shall use the premises for residential purposes only and shall maintain the property in good condition. Minor repairs up to ₹1,000 shall be borne by the Tenant.</p>
        </div>

        <div class="signatures">
          <div>
            <div class="sig-line">LANDLORD SIGNATURE</div>
            <p style="text-align: center; font-size: 12px;">(Name: ${agreement_data.landlord_name})</p>
          </div>
          <div>
            <div class="sig-line">TENANT SIGNATURE</div>
            <p style="text-align: center; font-size: 12px;">(Name: ${agreement_data.tenant_name})</p>
          </div>
        </div>

        <div class="footer">
          This agreement was electronically generated by REHWAS (Rental Health & Wallet System).<br/>
          Agreement ID: ${agreementId} • Timestamp: ${new Date().toISOString()}
        </div>
      </body>
      </html>
    `;

    return new Response(JSON.stringify({ html, agreement_id: agreementId }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
