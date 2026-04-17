/**
 * Represents a user profile in the system.
 * WHAT IT DOES: Defines the structure of user data, including their role (landlord or tenant) and verification status.
 * ANALOGY: A digital ID card or member profile in a residential club database.
 */
export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: 'landlord' | 'tenant';
  kyc_verified: boolean;
  created_at: string;
}

/**
 * Represents a rental property or room.
 * WHAT IT DOES: Defines the attributes of a room listing, such as rent amount, type, location, and amenities.
 * ANALOGY: An entry in a real estate catalog or a listing on a travel booking site.
 */
export interface Room {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  rent_amount: number;
  room_type: '1BHK' | '2BHK' | 'PG' | 'Studio';
  furnished: boolean;
  city: string;
  locality: string;
  address: string;
  latitude: number;
  longitude: number;
  available: boolean;
  amenities: string[];
  photos: string[];
  bhoomi_score?: number;
  bhoomi_grade?: 'A+' | 'A' | 'B+' | 'B';
  created_at: string;
}

/**
 * Represents a tenant's lease or stay information.
 * WHAT IT DOES: Associates a user profile with a specific room and tracks their move-in status.
 * ANALOGY: A tenant's entry in a landlord's physical lease agreement binder.
 */
export interface Tenant {
  id: string;
  room_id: string;
  landlord_id: string;
  tenant_profile_id: string;
  rent_amount: number;
  move_in_date: string;
  status: 'active' | 'past';
}

/**
 * Represents a record of rent payments.
 * WHAT IT DOES: Tracks monthly rent dues, payment status, and notes for each tenant.
 * ANALOGY: A receipt book or account ledger tracking monthly dues.
 */
export interface RentLedger {
  id: string;
  tenant_id: string;
  landlord_id: string;
  month: string;
  amount: number;
  utility_amount?: number;
  arrears?: number;
  status: 'paid' | 'unpaid' | 'partial';
  paid_on?: string;
  notes?: string;
}

/**
 * Represents a message between users in a room context.
 * WHAT IT DOES: Defines the structure of messages sent between landlords and tenants.
 * ANALOGY: A chat bubble or a letter sent between a resident and a property manager.
 */
export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}
