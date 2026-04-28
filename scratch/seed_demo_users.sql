-- Run this in your Supabase Dashboard SQL Editor to bypass the signUp trigger errors
-- and manually insert the Demo Accounts so you can sign in directly.

-- 1. Create Tenant Demo User
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), 
    'authenticated', 
    'authenticated', 
    'tenant@rehwas.com', 
    crypt('RehwasDemo@2026!', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Demo Tenant","role":"tenant"}', 
    now(), now()
) ON CONFLICT DO NOTHING;

-- 2. Create Landlord Demo User
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', 
    gen_random_uuid(), 
    'authenticated', 
    'authenticated', 
    'landlord@rehwas.com', 
    crypt('RehwasDemo@2026!', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{"full_name":"Demo Landlord","role":"landlord"}', 
    now(), now()
) ON CONFLICT DO NOTHING;

-- 3. Force create the corresponding public.profiles
INSERT INTO public.profiles (id, full_name, role)
SELECT id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'role'
FROM auth.users
WHERE email IN ('tenant@rehwas.com', 'landlord@rehwas.com')
ON CONFLICT (id) DO NOTHING;
