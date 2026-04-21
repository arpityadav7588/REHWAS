-- Create Waitlist Signups Table
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signups)
CREATE POLICY "Enable public inserts for waitlist"
ON public.waitlist_signups FOR INSERT
WITH CHECK (true);

-- Only admins can read signups (assuming an admin role or dashboard later)
-- For now, we'll just keep it secure.
