-- Fix profiles table voor SaaS multi-tenant setup

-- Voeg tenant_id toe aan profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Voeg role kolom toe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Update bestaande profile met jouw tenant_id
UPDATE profiles 
SET tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616',
    role = 'owner'
WHERE tenant_id IS NULL;

-- Voeg ook andere nuttige kolommen toe als ze missen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Probeer email te halen uit auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Kopieer display_name naar full_name als het bestaat
UPDATE profiles 
SET full_name = display_name
WHERE full_name IS NULL AND display_name IS NOT NULL;