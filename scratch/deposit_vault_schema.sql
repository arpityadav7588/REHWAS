-- REHWAS DEPOSIT VAULT SCHEMA
-- Purpose: Holds security deposit funds safely using Razorpay Route.

CREATE TABLE IF NOT EXISTS deposit_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'held', 'released', 'disputed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_transfer_id TEXT,
  release_requested_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deposit_escrow ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Landlords read their deposits" ON deposit_escrow;
DROP POLICY IF EXISTS "Tenants read their deposits" ON deposit_escrow;
DROP POLICY IF EXISTS "Service role manages all" ON deposit_escrow;

-- Policies
CREATE POLICY "Landlords read their deposits" 
  ON deposit_escrow FOR SELECT 
  USING (landlord_id = auth.uid());

CREATE POLICY "Tenants read their deposits" 
  ON deposit_escrow FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE tenant_profile_id = auth.uid()));

CREATE POLICY "Service role manages all" 
  ON deposit_escrow FOR ALL 
  USING (auth.role() = 'service_role');
