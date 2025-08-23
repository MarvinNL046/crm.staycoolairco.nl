-- Fix the create_tenant_rls_policies function specifically

-- First check all versions of this function
SELECT 
    'All versions of create_tenant_rls_policies' as info,
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'create_tenant_rls_policies';

-- Try different possible signatures
DO $$
BEGIN
    -- Try with (text, text)
    BEGIN
        ALTER FUNCTION public.create_tenant_rls_policies(text, text) SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed create_tenant_rls_policies(text, text)';
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'Function create_tenant_rls_policies(text, text) not found';
    END;
    
    -- Try with (p_table_name text, p_tenant_column text)
    BEGIN
        ALTER FUNCTION public.create_tenant_rls_policies(p_table_name text, p_tenant_column text) SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed create_tenant_rls_policies(p_table_name text, p_tenant_column text)';
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'Function create_tenant_rls_policies(p_table_name text, p_tenant_column text) not found';
    END;
    
    -- Try with just (text)
    BEGIN
        ALTER FUNCTION public.create_tenant_rls_policies(text) SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed create_tenant_rls_policies(text)';
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'Function create_tenant_rls_policies(text) not found';
    END;
    
    -- Try with (table_name text, tenant_column text)
    BEGIN
        ALTER FUNCTION public.create_tenant_rls_policies(table_name text, tenant_column text) SET search_path = public, pg_catalog;
        RAISE NOTICE 'Fixed create_tenant_rls_policies(table_name text, tenant_column text)';
    EXCEPTION WHEN undefined_function THEN
        RAISE NOTICE 'Function create_tenant_rls_policies(table_name text, tenant_column text) not found';
    END;
END $$;

-- Get the exact function definition to recreate it if needed
SELECT 
    'Full function definition' as info,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'create_tenant_rls_policies';

-- Final check
SELECT 
    'Final status' as info,
    p.proname,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proconfig IS NULL THEN '❌ Still NO search_path'
        WHEN p.proconfig::text LIKE '%search_path%' THEN '✅ search_path is now SET'
        ELSE '⚠️  Has config but no search_path: ' || p.proconfig::text
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname = 'create_tenant_rls_policies';