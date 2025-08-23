-- Investigate and fix the trigger issues

-- 1. Check the update_invoice_totals function
SELECT 
    'UPDATE_INVOICE_TOTALS FUNCTION' as check_type,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname = 'update_invoice_totals';

-- 2. Find ALL triggers/functions that reference "description"
SELECT 
    'FUNCTIONS WITH DESCRIPTION FIELD' as check_type,
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%NEW.description%' THEN 'Uses NEW.description'
        WHEN pg_get_functiondef(p.oid) LIKE '%OLD.description%' THEN 'Uses OLD.description'
        ELSE 'Other description reference'
    END as usage_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%description%'
    AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;

-- 3. Check all triggers that fire on user deletion
SELECT 
    'USER DELETION CASCADE TRIGGERS' as check_type,
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE 
        WHEN tgtype & 8 = 8 THEN 'DELETE'
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'OTHER'
    END as trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE (
    -- Tables that might be affected by user deletion
    c.relname IN ('profiles', 'tenant_users', 'user_tenants', 'team_members', 'system_audit_log', 'activities')
    OR n.nspname = 'auth'
)
ORDER BY n.nspname, c.relname, t.tgname;

-- 4. Check if there's a trigger on system_audit_log that might be the issue
SELECT 
    'SYSTEM_AUDIT_LOG TRIGGERS' as check_type,
    t.tgname as trigger_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.system_audit_log'::regclass;