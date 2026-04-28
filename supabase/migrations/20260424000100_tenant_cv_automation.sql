-- REHWAS RENTAL CV AUTOMATION
-- WHAT IT DOES: Sets up server-side triggers and cron jobs to ensure Tenant CVs are always fresh.
-- ANALOGY: Like a bank's overnight processing that updates your credit score after every payment.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create a function to trigger CV calculation for a specific profile
-- This uses pg_net to call the Supabase Edge Function asynchronously.
CREATE OR REPLACE FUNCTION public.recalculate_tenant_cv()
RETURNS TRIGGER AS $$
DECLARE
  tenant_profile_id UUID;
BEGIN
  -- Get the profile ID from the tenants table
  SELECT t.tenant_profile_id INTO tenant_profile_id
  FROM public.tenants t
  WHERE t.id = NEW.tenant_id;

  IF tenant_profile_id IS NOT NULL THEN
    -- Call the edge function
    -- Note: We use the SERVICE_ROLE_KEY or similar if needed, 
    -- but usually, we can use the project's internal URL.
    -- For this demo, we'll assume the URL and headers are handled via vault or environment variables in a real setup.
    -- Here we just define the logic for the trigger.
    
    PERFORM net.http_post(
      url := 'https://' || (SELECT value FROM net._settings WHERE name = 'project_url') || '/functions/v1/compute-tenant-cv',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM net._settings WHERE name = 'service_key')
      ),
      body := jsonb_build_object('profileId', tenant_profile_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger on rent_ledger updates
-- Recalculate whenever a payment is confirmed or updated.
DROP TRIGGER IF EXISTS on_rent_payment_confirmed ON public.rent_ledger;
CREATE TRIGGER on_rent_payment_confirmed
AFTER UPDATE OF status, amount ON public.rent_ledger
FOR EACH ROW
WHEN (NEW.status = 'paid' OR NEW.status = 'late')
EXECUTE FUNCTION public.recalculate_tenant_cv();

-- 4. Monthly Batch Refresh
-- This ensures that even if no payment was made (e.g. tenant stayed unpaid), 
-- the 'unpaid_count' and grade are updated.
-- We'll schedule it for the 2nd of every month at 2:00 AM.
SELECT cron.schedule(
  'monthly-cv-refresh',
  '0 2 2 * *',
  $$ 
    -- Loop through all active tenants and trigger their CV update
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN SELECT DISTINCT tenant_profile_id FROM public.tenants WHERE tenant_profile_id IS NOT NULL LOOP
        PERFORM net.http_post(
          url := 'https://' || (SELECT value FROM net._settings WHERE name = 'project_url') || '/functions/v1/compute-tenant-cv',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT value FROM net._settings WHERE name = 'service_key')
          ),
          body := jsonb_build_object('profileId', r.tenant_profile_id)
        );
      END LOOP;
    END;
    $$;
  $$
);
