-- AUTOMATED LATE FEE SYSTEM SCHEMA
-- 1. Add Late Fee columns to Rent Ledger
ALTER TABLE rent_ledger ADD COLUMN IF NOT EXISTS late_fee_applied INTEGER DEFAULT 0;
ALTER TABLE rent_ledger ADD COLUMN IF NOT EXISTS due_date DATE;

-- 2. Add Late Fee PCT to Rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS late_fee_pct INTEGER DEFAULT 5;

-- 3. Enable HTTP extension for Edge Function calling
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 4. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";

-- 5. Schedule the daily late fee check
-- Analogy: Setting a recurring alarm on your phone to wake you up at 10 AM every day.
-- This command tells the database to "wake up" at 10 AM and call our Supabase Edge Function.
-- We use pg_cron because it's a built-in scheduler that doesn't rely on external servers.
SELECT cron.schedule(
  'apply-late-fees-daily',
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/apply-late-fees',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_SERVICE_ROLE_KEY]"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Note: Replace [YOUR_PROJECT_REF] and [YOUR_SERVICE_ROLE_KEY] with actual values.
