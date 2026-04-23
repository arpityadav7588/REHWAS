/**
 * Represents a user profile in the system.
 */
export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: 'landlord' | 'tenant';
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  kyc_verified: boolean;
  aadhaar_hash?: string;
  avatar_url?: string;
  bhoomi_score?: number;
  plan: 'starter' | 'pro' | 'business';
  plan_expires_at?: string | null;
  trial_ends_at?: string | null;
  rooms_count: number;
  created_at: string;
  bio?: string;
  city?: string;
  notification_preferences?: {
    rent_reminders: boolean;
    reminder_days: number;
    visit_requests: boolean;
    chat_messages: boolean;
    maintenance_updates: boolean;
    platform_updates: boolean;
    channels: {
      in_app: boolean;
      whatsapp: boolean;
      email: boolean;
    };
  };
  preferences?: {
    language: string;
    date_format: string;
    default_dashboard_tab: string;
  };
  privacy_settings?: {
    profile_visibility: 'everyone' | 'tenants' | 'private';
    show_phone_after: 'visit' | 'agreement' | 'never';
  };
  onboarding_completed_steps?: string[];
  onboarding_dismissed?: boolean;
  onboarding_reminder_sent?: boolean;
}

/**
 * Represents a rental property or room.
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
  utility_billing_type?: 'fixed' | 'shared_headcount' | 'metered';
  utility_fixed_amount?: number;
  commute_metadata?: {
    nearest_metro?: string;
    metro_distance_km?: number;
    nearest_bus_stop?: string;
    peak_traffic_multiplier?: number;
  };
  street_video_url?: string | null;
  vacant_since?: string | null;
  expected_rent?: number;
  late_fee_pct?: number;
  boosted_until?: string | null;
  created_at: string;
}

/**
 * Represents a tenant's lease or stay information.
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
  due_date?: string;
  late_fee_applied?: number;
  payment_mode?: 'cash' | 'upi' | 'bank';
  notes?: string;
}

/**
 * Represents a message between users.
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
  category: 'maintenance' | 'tax' | 'insurance' | 'repair' | 'loan_interest' | 'other';
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

/**
 * DamageItem interface for inspections.
 */
export interface DamageItem {
  id: string;
  location: string;
  type: 'scratch' | 'dent' | 'stain' | 'broken' | 'missing' | 'other';
  severity: 'minor' | 'moderate' | 'severe';
  repair_cost: number;
  notes?: string;
  photo_x?: number; // Normalized coordinate 0-100
  photo_y?: number; // Normalized coordinate 0-100
  photo_index?: number;
  tenant_response?: string;
  is_disputed?: boolean;
}

/**
 * DepositEscrow tracking via Razorpay Route.
 */
export interface DepositEscrow {
  id: string;
  tenant_id: string;
  landlord_id: string;
  room_id: string;
  amount: number;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  razorpay_payment_id?: string;
  razorpay_transfer_id?: string;
  release_requested_at?: string;
  released_at?: string;
  dispute_reason?: string;
  created_at: string;
}

/**
 * Move-in/Move-out Report structure.
 */
export interface MoveInReport {
  id: string;
  tenant_id: string;
  room_id: string;
  landlord_id: string;
  photos: string[];
  photo_labels?: string[];
  notes?: string;
  tenant_notes?: string;
  checklist: InspectionChecklist;
  meter_reading?: string;
  landlord_signed_at: string;
  tenant_signed_at?: string;
  report_status: 'pending_landlord' | 'pending_tenant' | 'signed' | 'completed';
  type: 'move_in' | 'move_out';
  damage_items?: DamageItem[];
  total_damages_amount?: number;
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

export interface Notification {
  id: string;
  user_id: string;
  type: 'rent_paid' | 'visit_request' | 'new_message' | 'maintenance_open' | 'rent_due' | 'system';
  title: string;
  body: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface TenantCV {
  id: string;
  tenant_profile_id: string;
  on_time_payment_pct: number;
  total_months_tracked: number;
  paid_on_time_count: number;
  paid_late_count: number;
  unpaid_count: number;
  rent_health_grade: 'A' | 'B' | 'C' | 'N/A';
  last_calculated_at: string;
  created_at: string;
}

// EOF
