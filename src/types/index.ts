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
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  kyc_verified: boolean; // Keep for backward compatibility
  aadhaar_hash?: string;
  avatar_url?: string;
  bhoomi_score?: number; // Numeric scale 300-900 (Bhoomi 2.0)
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
  bhoomi_score?: number; // Numeric scale 300-900 (Bhoomi 2.0)
  bhoomi_grade?: 'A+' | 'A' | 'B+' | 'B';
  utility_billing_type?: 'fixed' | 'shared_headcount' | 'metered';
  utility_fixed_amount?: number;
  commute_metadata?: {
    nearest_metro?: string;
    metro_distance_km?: number;
    nearest_bus_stop?: string;
    peak_traffic_multiplier?: number;
  };
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
  payment_mode?: 'cash' | 'upi' | 'bank';
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

/**
 * Represents a property-related expense record.
 */
export interface Expense {
  id: string;
  landlord_id: string;
  room_id?: string | null;
  category: 'maintenance' | 'tax' | 'insurance' | 'repair' | 'other';
  amount: number;
  description: string;
  expense_date: string;
  created_at: string;
}

/**
 * Represents a monthly Profit & Loss summary.
 */
export interface PLSummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface MoveInReport {
  id: string;
  tenant_id: string;
  room_id: string;
  landlord_id: string;
  photos: string[];
  notes?: string;
  tenant_notes?: string;
  checklist: InspectionChecklist;
  meter_reading?: string;
  landlord_signed_at: string;
  tenant_signed_at?: string;
  report_status: 'pending_tenant' | 'completed';
  created_at: string;
}

export interface InspectionChecklist {
  electricity_working: boolean;
  water_working: boolean;
  wifi_connected: boolean;
  ac_working?: boolean;
  locks_functional: boolean;
  keys_handed_over: {
    main_door: boolean;
    room: boolean;
    mailbox: boolean;
  };
  deposit_receipt_given: boolean;
}
