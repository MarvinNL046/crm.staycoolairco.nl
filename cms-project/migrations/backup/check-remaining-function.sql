-- Check which function still doesn't have search_path

-- Find the function without config
SELECT 
    'Function without search_path' as info,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.prolang,
    l.lanname as language
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proconfig IS NULL;

-- Check our target functions specifically
SELECT 
    'Target functions status' as info,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig IS NULL THEN '❌ NO search_path'
        WHEN p.proconfig::text LIKE '%search_path%' THEN '✅ search_path SET'
        ELSE '⚠️  Has config but no search_path'
    END as status,
    p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_tenant_rls_policies', 'create_super_admin_user', 'get_user_tenant_id');

-- Let's also check what the Supabase linter now reports
-- by looking at all functions and their search_path status
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    CASE 
        WHEN p.proconfig IS NULL AND p.prosecdef = true THEN 'NEEDS FIX - Security Definer without search_path'
        WHEN p.proconfig IS NULL AND p.prosecdef = false THEN 'Probably OK - Not Security Definer'
        WHEN p.proconfig::text LIKE '%search_path%' THEN 'GOOD - Has search_path'
        ELSE 'CHECK - Has config but no search_path'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY 
    CASE 
        WHEN p.proconfig IS NULL AND p.prosecdef = true THEN 1
        WHEN p.proconfig IS NULL AND p.prosecdef = false THEN 2
        ELSE 3
    END,
    p.proname;