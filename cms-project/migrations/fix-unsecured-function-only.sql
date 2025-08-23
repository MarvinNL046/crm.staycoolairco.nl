-- First, let's see what we're dealing with
SELECT 
    p.oid,
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_user_tenant_id';

-- Find and fix only the unsecured version
DO $$
DECLARE
    func_oid oid;
    func_args text;
BEGIN
    -- Find the function that doesn't have search_path set
    SELECT p.oid, pg_get_function_identity_arguments(p.oid)
    INTO func_oid, func_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_user_tenant_id'
    AND NOT pg_get_functiondef(p.oid) LIKE '%search_path%'
    LIMIT 1;
    
    IF func_oid IS NOT NULL THEN
        -- Use ALTER FUNCTION to add search_path to the existing function
        EXECUTE format('ALTER FUNCTION public.get_user_tenant_id(%s) SET search_path = public', func_args);
        RAISE NOTICE 'Updated get_user_tenant_id(%) with secure search_path', func_args;
    ELSE
        RAISE NOTICE 'No unsecured get_user_tenant_id function found';
    END IF;
END $$;

-- Verify the result
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%search_path%' THEN 'SECURED'
        ELSE 'NOT SECURED'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_user_tenant_id', 'update_leads_search_fts')
ORDER BY p.proname, arguments;