-- Fix Function Search Path warnings (Simple version)
-- This script first shows what functions exist, then fixes them

-- Step 1: Show which functions actually exist
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments
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

-- Step 2: Generate ALTER commands for existing functions
SELECT 
    format('ALTER FUNCTION public.%I(%s) SET search_path = %s;',
        p.proname,
        pg_get_function_identity_arguments(p.oid),
        CASE 
            WHEN p.proname IN ('create_super_admin_user', 'create_tenant_for_user') THEN 'public, auth, pg_catalog'
            ELSE 'public, pg_catalog'
        END
    ) AS alter_command
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

-- Step 3: Actually run the fixes
-- Copy and run the ALTER commands from Step 2 above, or run this automated version:

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
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
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = %s',
            func_record.function_name, 
            func_record.arguments,
            func_record.search_path);
        
        RAISE NOTICE 'Fixed: public.%(%)', func_record.function_name, func_record.arguments;
    END LOOP;
END $$;