/**
 * Bhoomi Score 2.0 - Trust Algorithm
 * 
 * WHAT IT DOES: Calculates a trust grade (A+/A/B+/B/C) for a 
 * room listing based on three pillars: landlord identity (30%), 
 * property completeness (30%), and community signals (40%).
 * 
 * ANALOGY: Like a hotel's star rating — it considers the building 
 * quality AND the reviews AND the location, not just one factor.
 * 
 * WEIGHTED SCORING ANALOGY: Like school exams where finals count for 40% 
 * and homework only 10% — community signals matter most because they're 
 * hardest to fake by the landlord.
 */

export type BhoomiInput = {
  // Pillar 1: Landlord KYC (30 points max)
  landlord_kyc_verified: boolean        // +20 pts
  landlord_phone_verified: boolean      // +10 pts

  // Pillar 2: Amenity & Property Completeness (30 points max)
  photos_count: number                  // 0-8 pts (1pt per photo, max 8)
  amenities_count: number               // 0-12 pts (1pt per amenity, max 12)
  has_description: boolean              // +4 pts
  has_exact_coordinates: boolean        // +6 pts (pinned on map)

  // Pillar 3: Community Signals (40 points max)
  has_night_video: boolean              // +15 pts
  tenant_reviews_count: number          // 0-15 pts (3pt per review, max 5 reviews)
  avg_review_rating: number             // multiplier on review score (0-5)
  move_in_reports_completed: number     // 0-10 pts (5pt each, max 2)
}

export type BhoomiResult = {
  score: number           // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C'
  gradeColor: string
  breakdown: {
    kycScore: number
    propertyScore: number
    communityScore: number
  }
  strengths: string[]     // e.g. ["KYC Verified", "Night View Available"]
  improvements: string[]  // e.g. ["Add more photos", "Collect tenant reviews"]
}

export function calculateBhoomiScore(input: BhoomiInput): BhoomiResult {
  
  // Pillar 1: Landlord KYC (max 30)
  const kycScore = 
    (input.landlord_kyc_verified ? 20 : 0) +
    (input.landlord_phone_verified ? 10 : 0)
  
  // Pillar 2: Property Completeness (max 30)
  const photoScore = Math.min(input.photos_count, 8)
  const amenityScore = Math.min(input.amenities_count, 12)
  const propertyScore = 
    photoScore + amenityScore +
    (input.has_description ? 4 : 0) +
    (input.has_exact_coordinates ? 6 : 0)
  
  // Pillar 3: Community (max 40)
  const nightVideoScore = input.has_night_video ? 15 : 0
  const reviewBase = Math.min(input.tenant_reviews_count * 3, 15)
  const reviewScore = input.avg_review_rating > 0
    ? Math.round(reviewBase * (input.avg_review_rating / 5))
    : reviewBase
  const moveInScore = Math.min(input.move_in_reports_completed * 5, 10)
  const communityScore = nightVideoScore + reviewScore + moveInScore
  
  const totalScore = kycScore + propertyScore + communityScore
  
  const grade =
    totalScore >= 90 ? 'A+' :
    totalScore >= 78 ? 'A' :
    totalScore >= 65 ? 'B+' :
    totalScore >= 50 ? 'B' : 'C'
  
  const gradeColor =
    grade === 'A+' ? '#059669' :
    grade === 'A'  ? '#10B981' :
    grade === 'B+' ? '#F59E0B' :
    grade === 'B'  ? '#F97316' : '#EF4444'
  
  const strengths = [
    input.landlord_kyc_verified && 'KYC Verified landlord',
    input.has_night_video && 'Night street view available',
    input.photos_count >= 6 && 'Well photographed',
    input.amenities_count >= 8 && 'Fully amenitised',
    input.move_in_reports_completed > 0 && 'Move-in reports on record',
  ].filter(Boolean) as string[]
  
  const improvements = [
    !input.landlord_kyc_verified && 'Landlord should complete KYC',
    !input.has_night_video && 'Add night street view video',
    input.photos_count < 6 && `Add ${6 - input.photos_count} more photos`,
    input.amenities_count < 8 && 'List more amenities',
    input.tenant_reviews_count === 0 && 'No tenant reviews yet',
  ].filter(Boolean) as string[]
  
  return {
    score: totalScore,
    grade,
    gradeColor,
    breakdown: { kycScore, propertyScore, communityScore },
    strengths,
    improvements
  }
}

/**
 * Recomputes the Bhoomi Score for a room by invoking the Supabase Edge Function.
 * WHAT IT DOES: Triggers an immediate refresh of the trust score calculation.
 * ANALOGY: Like a credit score that updates immediately when you pay off 
 * a loan — not just once a month.
 */
export async function recomputeBhoomiScore(roomId: string, supabase: any) {
  try {
    const { data, error } = await supabase.functions.invoke('recompute-bhoomi', {
      body: { room_id: roomId },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to recompute Bhoomi Score:', err);
    return null;
  }
}
