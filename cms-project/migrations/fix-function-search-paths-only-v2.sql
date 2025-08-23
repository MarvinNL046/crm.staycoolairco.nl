-- Fix Function Search Path warnings only (v2 - compatible with newer PostgreSQL)
-- This migration only fixes the search_path for functions, without touching extensions

-- Display all functions that need fixing
SELECT 
    'ALTER FUNCTION public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') SET search_path = ' ||
    CASE 
        WHEN p.proname IN ('create_super_admin_user', 'create_tenant_for_user') THEN 'public, auth, pg_catalog;'
        ELSE 'public, pg_catalog;'
    END AS fix_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_recurring_appointments',
    'get_user_tenant_id',
    'set_updated_at',
    'update_updated_at_column',
    'create_super_admin_user',
    'create_tenant_for_user',
    'update_automation_rules_updated_at',
    'create_default_automation_rules',
    'create_tenant_rls_policies',
    'calculate_invoice_totals',
    'update_invoice_totals',
    'generate_invoice_number'
)
ORDER BY p.proname;

-- Now actually fix them
DO $$
DECLARE
    func_record RECORD;
    fix_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting to fix function search paths...';
    RAISE NOTICE '';
    
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            p.oid,
            CASE 
                WHEN p.proname IN ('create_super_admin_user', 'create_tenant_for_user') THEN 'public, auth, pg_catalog'
                ELSE 'public, pg_catalog'
            END AS search_path
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'generate_recurring_appointments',
            'get_user_tenant_id',
            'set_updated_at',
            'update_updated_at_column',
            'create_super_admin_user',
            'create_tenant_for_user',
            'update_automation_rules_updated_at',
            'create_default_automation_rules',
            'create_tenant_rls_policies',
            'calculate_invoice_totals',
            'update_invoice_totals',
            'generate_invoice_number'
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = %s',
                func_record.function_name, 
                func_record.arguments,
                func_record.search_path);
            
            RAISE NOTICE '✓ Fixed: public.%(%)', func_record.function_name, func_record.arguments;
            fix_count := fix_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '✗ Error fixing public.%(%) - %', func_record.function_name, func_record.arguments, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed % functions total', fix_count;
    
    -- Check if there are any functions we might have missed (updated for newer PostgreSQL)
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for other functions without search_path set...';
    
    FOR func_record IN
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            p.prokind AS function_kind
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind IN ('f', 'p')  -- Regular functions and procedures
        AND p.proconfig IS NULL  -- No configuration set
        AND p.proname NOT LIKE 'pgp_%'  -- Skip pgcrypto functions
        AND p.proname NOT IN (
            'generate_recurring_appointments',
            'get_user_tenant_id',
            'set_updated_at',
            'update_updated_at_column',
            'create_super_admin_user',
            'create_tenant_for_user',
            'update_automation_rules_updated_at',
            'create_default_automation_rules',
            'create_tenant_rls_policies',
            'calculate_invoice_totals',
            'update_invoice_totals',
            'generate_invoice_number'
        )
        LIMIT 10
    LOOP
        RAISE NOTICE 'Found: public.%(%) [type: %] - consider setting search_path', 
            func_record.function_name, func_record.arguments, func_record.function_kind;
    END LOOP;
END $$;

-- Summary of what this migration does:
-- 1. Finds all specified functions in the public schema
-- 2. Sets their search_path to prevent SQL injection vulnerabilities
-- 3. Reports on success/failure for each function
-- 4. Lists other functions that might also need search_path setting