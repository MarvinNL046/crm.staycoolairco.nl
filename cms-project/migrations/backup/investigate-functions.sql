-- Investigate the exact function definitions to understand why search_path isn't being set

-- Get complete function information
SELECT 
    'Function Details' as info,
    p.oid,
    p.proname as function_name,
    n.nspname as schema_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prolang,
    l.lanname as language,
    p.prosecdef as security_definer,
    p.proisstrict as is_strict,
    p.provolatile as volatility,
    p.proconfig as config_settings,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user')
ORDER BY p.proname;

-- Check if there are overloaded versions
SELECT 
    'Overloaded Functions Check' as info,
    p.proname,
    COUNT(*) as version_count,
    array_agg(pg_get_function_identity_arguments(p.oid)) as all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user')
GROUP BY p.proname
HAVING COUNT(*) > 1;

-- Try a different approach - ALTER FUNCTION
DO $$
DECLARE
    func_oid oid;
    func_name text;
BEGIN
    -- Find and alter each function
    FOR func_oid, func_name IN 
        SELECT p.oid, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
            AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user')
    LOOP
        -- Try to alter the function to set search_path
        EXECUTE format('ALTER FUNCTION public.%I%s SET search_path = public, pg_catalog',
            func_name,
            pg_get_function_identity_arguments(func_oid));
        
        RAISE NOTICE 'Altered function: %', func_name;
    END LOOP;
END $$;

-- Verify after ALTER FUNCTION approach
SELECT 
    'After ALTER FUNCTION attempt' as status,
    p.proname,
    p.proconfig,
    CASE 
        WHEN p.proconfig IS NULL THEN 'Still no search_path'
        WHEN p.proconfig::text LIKE '%search_path%' THEN 'Search path set!'
        ELSE 'Has config but no search_path'
    END as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user');