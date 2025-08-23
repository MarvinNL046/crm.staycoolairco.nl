-- Fix the profiles table structure to match requirements

-- First, rename user_id to id if needed
DO $$
BEGIN
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
END $$;

-- Add missing columns
DO $$
BEGIN
    -- Add tenant_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
    
    -- Add email column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- Add full_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- Add avatar_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Add role column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update existing profiles with tenant_id
UPDATE profiles 
SET tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'
WHERE tenant_id IS NULL;

-- Copy display_name to full_name if needed
UPDATE profiles 
SET full_name = display_name
WHERE full_name IS NULL AND display_name IS NOT NULL;

-- Get user email from auth.users if possible
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;