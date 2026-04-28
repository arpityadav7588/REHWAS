-- Create notifications table for Tenants
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create landlord_notifications table for Landlords
CREATE TABLE IF NOT EXISTS public.landlord_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications (Tenants)
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow system inserts for notifications" ON public.notifications;
CREATE POLICY "Allow system inserts for notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- Policies for landlord_notifications (Landlords)
DROP POLICY IF EXISTS "Landlords can see their own notifications" ON public.landlord_notifications;
CREATE POLICY "Landlords can see their own notifications" 
ON public.landlord_notifications FOR SELECT 
USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Landlords can update their own notifications" ON public.landlord_notifications;
CREATE POLICY "Landlords can update their own notifications" 
ON public.landlord_notifications FOR UPDATE 
USING (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Allow system inserts for landlord_notifications" ON public.landlord_notifications;
CREATE POLICY "Allow system inserts for landlord_notifications" 
ON public.landlord_notifications FOR INSERT 
WITH CHECK (true);

-- Refresh PostgREST cache
NOTIFY pgrst, 'reload schema';
