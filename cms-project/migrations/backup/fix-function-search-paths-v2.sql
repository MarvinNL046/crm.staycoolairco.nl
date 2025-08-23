-- Fix function search path security warnings - Version 2
-- First, let's get the exact function signatures

-- Check current function details
SELECT 
    p.proname,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.proconfig,
    p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user');

-- Drop and recreate the functions with proper search_path

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.create_tenant_rls_policies(text, text);
DROP FUNCTION IF EXISTS public.create_super_admin_user(uuid, text);

-- Recreate create_tenant_rls_policies with search_path
CREATE OR REPLACE FUNCTION public.create_tenant_rls_policies(
    p_table_name text,
    p_tenant_column text DEFAULT 'tenant_id'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- Enable RLS on the table
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table_name);
    
    -- Create policy for viewing records
    EXECUTE format(
        'CREATE POLICY "Users can view own tenant data" ON %I 
         FOR SELECT TO authenticated 
         USING (%I = get_user_tenant_id())',
        p_table_name, p_tenant_column
    );
    
    -- Create policy for inserting records
    EXECUTE format(
        'CREATE POLICY "Users can insert own tenant data" ON %I 
         FOR INSERT TO authenticated 
         WITH CHECK (%I = get_user_tenant_id())',
        p_table_name, p_tenant_column
    );
    
    -- Create policy for updating records
    EXECUTE format(
        'CREATE POLICY "Users can update own tenant data" ON %I 
         FOR UPDATE TO authenticated 
         USING (%I = get_user_tenant_id())',
        p_table_name, p_tenant_column
    );
    
    -- Create policy for deleting records
    EXECUTE format(
        'CREATE POLICY "Users can delete own tenant data" ON %I 
         FOR DELETE TO authenticated 
         USING (%I = get_user_tenant_id())',
        p_table_name, p_tenant_column
    );
END;
$$;

-- Recreate create_super_admin_user with search_path
CREATE OR REPLACE FUNCTION public.create_super_admin_user(
    p_user_id uuid,
    p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
    -- Insert user into super_admins table
    INSERT INTO public.super_admins (user_id, email, created_at)
    VALUES (p_user_id, p_email, NOW())
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Verify the fixes worked
SELECT 
    'Verification after recreation' as status,
    p.proname,
    p.prosecdef as security_definer,
    CASE 
        WHEN p.proconfig IS NULL THEN 'NO SEARCH PATH - STILL NEEDS FIX'
        WHEN p.proconfig::text LIKE '%search_path%' THEN 'HAS SEARCH PATH - FIXED'
        ELSE 'Unknown config: ' || p.proconfig::text
    END as search_path_status,
    p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user', 'get_user_tenant_id');

-- Final check for any remaining functions without search_path
SELECT 
    'Final check - Functions still without search_path' as info,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proconfig IS NULL
    AND p.prokind = 'f'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user');