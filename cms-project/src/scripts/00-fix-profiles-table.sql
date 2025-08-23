-- Add tenant_id to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        -- Update existing profile with the tenant_id
        UPDATE profiles 
        SET tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'
        WHERE tenant_id IS NULL;
    END IF;
END $$;