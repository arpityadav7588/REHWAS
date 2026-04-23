-- REHWAS SCHEMA UPDATE: Escrow, Tenant CV, and Subscriptions
-- Run this in the Supabase SQL Editor exactly.

────────────────────────────────────
-- TABLE 1: deposit_escrow
-- Purpose: Holds security deposit funds safely while tenancy is active.
────────────────────────────────────

CREATE TABLE IF NOT EXISTS deposit_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'released', 'disputed', 'refunded')),
  razorpay_payment_id TEXT,
  razorpay_transfer_id TEXT,
  release_requested_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deposit_escrow ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Landlords can see their escrow deposits" ON deposit_escrow;
DROP POLICY IF EXISTS "Tenants can see their own escrow" ON deposit_escrow;
DROP POLICY IF EXISTS "Service role can insert and update" ON deposit_escrow;

CREATE POLICY "Landlords can see their escrow deposits"
  ON deposit_escrow FOR SELECT
  USING (landlord_id = auth.uid());

CREATE POLICY "Tenants can see their own escrow"
  ON deposit_escrow FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE tenant_profile_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert and update"
  ON deposit_escrow FOR ALL
  USING (auth.role() = 'service_role');

────────────────────────────────────
-- TABLE 2: tenant_cv
-- Purpose: Stores a tenant's computed rent payment track record.
────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_cv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  on_time_payment_pct NUMERIC DEFAULT 0
    CHECK (on_time_payment_pct >= 0 AND on_time_payment_pct <= 100),
  total_months_tracked INTEGER DEFAULT 0,
  paid_on_time_count INTEGER DEFAULT 0,
  paid_late_count INTEGER DEFAULT 0,
  unpaid_count INTEGER DEFAULT 0,
  rent_health_grade TEXT DEFAULT 'N/A'
    CHECK (rent_health_grade IN ('A', 'B', 'C', 'N/A')),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_cv ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read tenant CV (public profile)" ON tenant_cv;
DROP POLICY IF EXISTS "Only service role can write tenant CV" ON tenant_cv;

CREATE POLICY "Anyone can read tenant CV (public profile)"
  ON tenant_cv FOR SELECT
  USING (TRUE);

CREATE POLICY "Only service role can write tenant CV"
  ON tenant_cv FOR ALL
  USING (auth.role() = 'service_role');

-- Postgres function to compute the CV from ledger records
CREATE OR REPLACE FUNCTION calculate_tenant_cv(p_tenant_profile_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_on_time INTEGER;
  v_late INTEGER;
  v_unpaid INTEGER;
  v_pct NUMERIC;
  v_grade TEXT;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'paid' AND paid_on <= due_date),
    COUNT(*) FILTER (WHERE status = 'paid' AND paid_on > due_date),
    COUNT(*) FILTER (WHERE status = 'unpaid')
  INTO v_total, v_on_time, v_late, v_unpaid
  FROM rent_ledger rl
  JOIN tenants t ON t.id = rl.tenant_id
  WHERE t.tenant_profile_id = p_tenant_profile_id
    AND rl.due_date < CURRENT_DATE;

  IF v_total = 0 THEN
    v_pct := 0; v_grade := 'N/A';
  ELSE
    v_pct := ROUND((v_on_time::NUMERIC / v_total) * 100, 1);
    v_grade := CASE
      WHEN v_pct >= 90 THEN 'A'
      WHEN v_pct >= 70 THEN 'B'
      ELSE 'C'
    END;
  END IF;

  INSERT INTO tenant_cv (
    tenant_profile_id, total_months_tracked, paid_on_time_count,
    paid_late_count, unpaid_count, on_time_payment_pct,
    rent_health_grade, last_calculated_at
  ) VALUES (
    p_tenant_profile_id, v_total, v_on_time,
    v_late, v_unpaid, v_pct,
    v_grade, NOW()
  )
  ON CONFLICT (tenant_profile_id) DO UPDATE SET
    total_months_tracked = EXCLUDED.total_months_tracked,
    paid_on_time_count = EXCLUDED.paid_on_time_count,
    paid_late_count = EXCLUDED.paid_late_count,
    unpaid_count = EXCLUDED.unpaid_count,
    on_time_payment_pct = EXCLUDED.on_time_payment_pct,
    rent_health_grade = EXCLUDED.rent_health_grade,
    last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

────────────────────────────────────
-- TABLE 3: subscriptions
-- Purpose: Tracks each landlord's Razorpay subscription state.
────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter'
    CHECK (plan IN ('starter', 'pro', 'business')),
  razorpay_sub_id TEXT UNIQUE,
  razorpay_plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can read their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role manages all subscriptions" ON subscriptions;

CREATE POLICY "Landlords can read their own subscription"
  ON subscriptions FOR SELECT
  USING (landlord_id = auth.uid());

CREATE POLICY "Service role manages all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-enroll existing landlords into the free starter plan
INSERT INTO subscriptions (landlord_id, plan, status)
SELECT id, 'starter', 'active'
FROM profiles
WHERE role = 'landlord'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE landlord_id = profiles.id
  )
ON CONFLICT DO NOTHING;
