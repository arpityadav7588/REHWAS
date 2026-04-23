import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * REHWAS EDGE FUNCTION: recompute-bhoomi
 * 
 * WHAT IT DOES: Recomputes the trust score for a specific property 
 * based on identity, property quality, and community feedback.
 * 
 * ANALOGY: Like a bank re-evaluating your loan eligibility as soon 
 * as you submit new financial documents.
 */

serve(async (req) => {
  const { room_id } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Fetch all data needed for calculation
  const { data: room } = await supabase
    .from('rooms')
    .select('*, profiles!landlord_id(kyc_verified, phone)')
    .eq('id', room_id)
    .single()
  
  const { count: videoCount } = await supabase
    .from('street_night_videos')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room_id)
    .eq('is_approved', true)
  
  const { data: reviews } = await supabase
    .from('room_reviews')
    .select('rating')
    .eq('room_id', room_id)
  
  const { count: moveInCount } = await supabase
    .from('move_in_reports')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room_id)
    .not('landlord_signed_at', 'is', null)
    .not('tenant_signed_at', 'is', null)
  
  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  // 2. Calculation Logic (Simplified mirror of src/lib/bhoomiScore.ts)
  // Pillar 1: KYC
  const kycScore = (room.profiles?.kyc_verified ? 20 : 0) + (room.profiles?.phone ? 10 : 0)
  
  // Pillar 2: Property
  const photoScore = Math.min(room.photos?.length || 0, 8)
  const amenityScore = Math.min(room.amenities?.length || 0, 12)
  const propertyScore = photoScore + amenityScore + 
    (room.description?.length > 50 ? 4 : 0) + 
    (room.latitude && room.longitude ? 6 : 0)
  
  // Pillar 3: Community
  const nightVideoScore = (videoCount || 0) > 0 ? 15 : 0
  const reviewBase = Math.min((reviews?.length || 0) * 3, 15)
  const reviewScore = avgRating > 0 ? Math.round(reviewBase * (avgRating / 5)) : reviewBase
  const moveInScore = Math.min((moveInCount || 0) * 5, 10)
  const communityScore = nightVideoScore + reviewScore + moveInScore
  
  const totalScore = kycScore + propertyScore + communityScore
  
  const grade =
    totalScore >= 90 ? 'A+' :
    totalScore >= 78 ? 'A' :
    totalScore >= 65 ? 'B+' :
    totalScore >= 50 ? 'B' : 'C'
  
  // 3. Update Database
  await supabase
    .from('rooms')
    .update({
      bhoomi_score: totalScore,
      bhoomi_grade: grade,
      bhoomi_last_computed: new Date().toISOString()
    })
    .eq('id', room_id)
  
  return new Response(JSON.stringify({ 
    success: true, 
    score: totalScore, 
    grade 
  }), {
    headers: { "Content-Type": "application/json" },
  })
})
