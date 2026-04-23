-- Migration: Add Onboarding Columns to Profiles
-- WHY: Track landlord activation steps to increase product retention.

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_steps TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_reminder_sent BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed_steps IS 'Array of completed onboarding step IDs: room, tenant, rent, reminder, profile';
