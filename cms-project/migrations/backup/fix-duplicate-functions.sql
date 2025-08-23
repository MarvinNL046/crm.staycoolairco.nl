-- Check for duplicate/overloaded functions
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

-- Drop all versions of get_user_tenant_id and recreate with secure search_path
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all existing versions of get_user_tenant_id
    FOR func_record IN 
        SELECT 
            'DROP FUNCTION IF EXISTS public.' || proname || '(' || pg_get_function_identity_arguments(oid) || ');' as drop_cmd
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_tenant_id'
    LOOP
        EXECUTE func_record.drop_cmd;
        RAISE NOTICE 'Dropped function: %', func_record.drop_cmd;
    END LOOP;
    
    -- Create the secure version
    CREATE FUNCTION public.get_user_tenant_id(user_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        tenant_id uuid;
    BEGIN
        -- Get tenant_id from profiles table
        SELECT p.tenant_id INTO tenant_id
        FROM public.profiles p
        WHERE p.id = user_id;
        
        -- Return the tenant_id (will be NULL if user not found)
        RETURN tenant_id;
    END;
    $$;
    
    -- Grant permissions
    GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO service_role;
    
    RAISE NOTICE 'Created secure version of get_user_tenant_id';
END $$;

-- Verify the final state
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