-- Verify all functions are now secured
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%search_path%' THEN '✅ SECURED'
        ELSE '❌ NOT SECURED'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_user_tenant_id', 'update_leads_search_fts')
ORDER BY p.proname, arguments;

-- Check if there are any other functions without search_path set
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    '❌ NOT SECURED - Missing search_path' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'  -- Only functions, not procedures
AND NOT pg_get_functiondef(p.oid) LIKE '%search_path%'
AND p.proname NOT LIKE 'pgp_%'  -- Exclude pgcrypto functions
AND p.proname NOT LIKE 'armor%'  -- Exclude armor functions
AND p.proname NOT LIKE 'dearmor%'  -- Exclude dearmor functions
AND p.proname NOT LIKE 'gen_salt%'  -- Exclude gen_salt functions
AND p.proname NOT LIKE 'crypt%'  -- Exclude crypt functions
AND p.proname NOT LIKE 'encrypt%'  -- Exclude encrypt functions
AND p.proname NOT LIKE 'decrypt%'  -- Exclude decrypt functions
ORDER BY p.proname;