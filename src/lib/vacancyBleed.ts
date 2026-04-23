/**
 * WHAT IT DOES: Calculates how much revenue a landlord has lost
 * due to a room sitting empty.
 * ANALOGY: Like a taxi meter running backwards — every second 
 * the car sits parked is money the driver didn't earn.
 */

export interface VacancyBleedResult {
  daysVacant: number
  dailyLoss: number
  totalLoss: number
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  urgencyLabel: string
}

/**
 * Calculates the vacancy bleed for a given room.
 * 
 * WHY WE SHOW ₹ LOSS: "21 days" feels abstract, "₹14,700 lost" is visceral and real.
 * It triggers loss aversion, making the decision to upgrade to Pro (to boost the listing) 
 * a "no-brainer".
 * 
 * @param room - The room object containing vacancy and rent info.
 * @returns The vacancy bleed result or null if the room is not vacant.
 */
export function calculateVacancyBleed(room: {
  vacant_since: string | null
  expected_rent?: number
  rent_amount: number
}): VacancyBleedResult | null {
  if (!room.vacant_since) return null
  
  const vacantSince = new Date(room.vacant_since)
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const daysVacant = Math.max(1, Math.floor((now.getTime() - vacantSince.getTime()) / msPerDay))
  
  const monthlyRent = room.expected_rent || room.rent_amount
  const dailyLoss = Math.round(monthlyRent / 30)
  const totalLoss = daysVacant * dailyLoss
  
  const urgencyLevel =
    daysVacant <= 7 ? 'low' :
    daysVacant <= 21 ? 'medium' :
    daysVacant <= 45 ? 'high' : 'critical'
  
  const urgencyLabel =
    urgencyLevel === 'low' ? 'Just started' :
    urgencyLevel === 'medium' ? 'Getting expensive' :
    urgencyLevel === 'high' ? 'Significant loss' : 'Critical — act now'
  
  return { daysVacant, dailyLoss, totalLoss, urgencyLevel, urgencyLabel }
}
