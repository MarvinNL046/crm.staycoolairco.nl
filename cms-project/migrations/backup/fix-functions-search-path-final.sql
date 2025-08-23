-- Fix function search path security warnings - Final version

-- First, let's see the exact function signatures
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    format('%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) as full_signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user');

-- Now let's fix them using the correct ALTER FUNCTION syntax
BEGIN;

-- Fix create_tenant_rls_policies
ALTER FUNCTION public.create_tenant_rls_policies(p_table_name text, p_tenant_column text) 
SET search_path = public, pg_catalog;

-- Fix create_super_admin_user  
ALTER FUNCTION public.create_super_admin_user(user_email text)
SET search_path = public, pg_catalog;

COMMIT;

-- If the above fails because of different signatures, try these alternatives:

-- Alternative signatures that might exist:
-- ALTER FUNCTION public.create_tenant_rls_policies(text, text) SET search_path = public, pg_catalog;
-- ALTER FUNCTION public.create_tenant_rls_policies(text) SET search_path = public, pg_catalog;
-- ALTER FUNCTION public.create_super_admin_user(uuid, text) SET search_path = public, pg_catalog;
-- ALTER FUNCTION public.create_super_admin_user(text, text) SET search_path = public, pg_catalog;

-- Verify the fix worked
SELECT 
    'Verification Results' as status,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NULL THEN '❌ NO search_path'
        WHEN p.proconfig::text LIKE '%search_path%' THEN '✅ search_path SET'
        ELSE '⚠️  Has config but no search_path'
    END as search_path_status,
    p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user');

-- Check all functions in public schema for search_path issues
SELECT 
    'Summary of public schema functions' as info,
    COUNT(*) FILTER (WHERE proconfig IS NULL) as functions_without_config,
    COUNT(*) FILTER (WHERE proconfig IS NOT NULL AND proconfig::text LIKE '%search_path%') as functions_with_search_path,
    COUNT(*) FILTER (WHERE proconfig IS NOT NULL AND proconfig::text NOT LIKE '%search_path%') as functions_with_other_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f';