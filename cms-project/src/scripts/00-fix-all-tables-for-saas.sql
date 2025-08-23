-- Complete fix voor SaaS multi-tenant setup
-- Dit script fixt ALLE tabellen voor proper multi-tenant gebruik

-- 1. Fix tenants tabel
DO $$
BEGIN
    -- Voeg domain kolom toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'domain'
    ) THEN
        ALTER TABLE tenants ADD COLUMN domain VARCHAR(255);
    END IF;
    
    -- Voeg settings kolom toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;
    
    -- Voeg created_at toe als het niet bestaat
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE tenants ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Voeg updated_at toe als het niet bestaat
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Fix profiles tabel
DO $$
BEGIN
    -- Rename user_id naar id als nodig
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE profiles RENAME COLUMN user_id TO id;
    END IF;
    
    -- Voeg tenant_id toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    -- Voeg andere benodigde kolommen toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Update bestaande tenant met domain
UPDATE tenants 
SET domain = 'staycoolairco.nl'
WHERE id = '80496bff-b559-4b80-9102-3a84afdaa616'
AND domain IS NULL;

-- 4. Update bestaande profiles met tenant_id
UPDATE profiles 
SET tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'
WHERE tenant_id IS NULL;

-- 5. Kopieer display_name naar full_name
UPDATE profiles 
SET full_name = display_name
WHERE full_name IS NULL AND display_name IS NOT NULL;

-- 6. Probeer email te halen uit auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Geef feedback
DO $$
DECLARE
    tenant_count INTEGER;
    profile_count INTEGER;
    profiles_with_tenant INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO profiles_with_tenant FROM profiles WHERE tenant_id IS NOT NULL;
    
    RAISE NOTICE 'Setup compleet!';
    RAISE NOTICE 'Tenants: %', tenant_count;
    RAISE NOTICE 'Profiles: %', profile_count;
    RAISE NOTICE 'Profiles met tenant_id: %', profiles_with_tenant;
END $$;