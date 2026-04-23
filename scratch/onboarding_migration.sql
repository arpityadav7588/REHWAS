-- REHWAS SCHEMA UPDATE: SaaS Readiness & Onboarding
-- Run this in the Supabase SQL Editor exactly.

────────────────────────────────────
-- PART 1: UPDATE rooms TABLE
────────────────────────────────────

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS vacant_since DATE,
  ADD COLUMN IF NOT EXISTS expected_rent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS street_video_url TEXT,
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS late_fee_pct NUMERIC DEFAULT 5;

COMMENT ON COLUMN rooms.vacant_since IS
  'Date the room became vacant (available=true). Used to calculate vacancy bleed cost.';
COMMENT ON COLUMN rooms.expected_rent IS
  'The rent the landlord expects to collect. May differ from listed rent_amount. Used for vacancy loss calculation.';
COMMENT ON COLUMN rooms.street_video_url IS
  'Supabase Storage URL of the night-mode street view video uploaded by landlord.';
COMMENT ON COLUMN rooms.boosted_until IS
  'If set and in the future, this listing appears at the top of map/list results. Set via paid boost feature.';
COMMENT ON COLUMN rooms.late_fee_pct IS
  'Percentage late fee applied to overdue rent. Default 5%. Landlord can configure per room.';

-- Trigger to automatically set vacant_since when room status changes to available
CREATE OR REPLACE FUNCTION set_vacant_since_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.vacant_since := CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vacant_since ON rooms;
CREATE TRIGGER set_vacant_since
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  WHEN (OLD.available = FALSE AND NEW.available = TRUE AND NEW.vacant_since IS NULL)
  EXECUTE FUNCTION set_vacant_since_fn();

────────────────────────────────────
-- PART 2: UPDATE rent_ledger TABLE
────────────────────────────────────

ALTER TABLE rent_ledger
  ADD COLUMN IF NOT EXISTS late_fee_applied NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE;

COMMENT ON COLUMN rent_ledger.late_fee_applied IS
  'Late fee amount (in ₹) automatically appended by the daily cron job when rent is overdue by 5+ days.';
COMMENT ON COLUMN rent_ledger.due_date IS
  'The specific date rent was due (typically the 1st of each month). Used by the cron to detect overdue entries.';

-- Backfill due_date based on the month string (YYYY-MM)
UPDATE rent_ledger
SET due_date = (month || '-01')::DATE
WHERE due_date IS NULL;

────────────────────────────────────
-- PART 3: UPDATE profiles TABLE
────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter'
    CHECK (plan IN ('starter', 'pro', 'business')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_steps TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_dismissed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_reminder_sent BOOLEAN DEFAULT FALSE;
