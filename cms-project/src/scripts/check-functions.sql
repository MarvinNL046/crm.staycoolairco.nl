-- Check all functions in the public schema that need search_path fixes
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS security_definer,
    p.proconfig AS current_config
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