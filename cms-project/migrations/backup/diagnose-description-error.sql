-- Diagnose the "description" field error on user deletion

-- 1. Find functions that use NEW.description or OLD.description
WITH function_search AS (
    SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_functiondef(p.oid) as function_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('public', 'auth')
)
SELECT 
    'FUNCTIONS WITH DESCRIPTION' as check_type,
    schema_name,
    function_name,
    CASE 
        WHEN function_def LIKE '%NEW.description%' THEN '❌ PROBLEM: Uses NEW.description'
        WHEN function_def LIKE '%OLD.description%' THEN '⚠️ Uses OLD.description'
        WHEN function_def LIKE '%description%' THEN '📝 References description'
        ELSE 'No description reference'
    END as issue
FROM function_search
WHERE function_def LIKE '%description%'
ORDER BY 
    CASE 
        WHEN function_def LIKE '%NEW.description%' THEN 1
        WHEN function_def LIKE '%OLD.description%' THEN 2
        ELSE 3
    END,
    schema_name, function_name;

-- 2. Check all DELETE triggers that might fire during user deletion
SELECT 
    'DELETE TRIGGERS' as check_type,
    n.nspname || '.' || c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE 
        WHEN n.nspname = 'auth' AND c.relname = 'users' THEN '🎯 Direct on auth.users'
        WHEN c.relname IN ('profiles', 'tenant_users', 'team_members') THEN '⚠️ User-related table'
        ELSE '📝 Other table'
    END as relevance
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE (tgtype & 8 = 8) -- DELETE event
    OR (tgtype & 16 = 16) -- UPDATE event (might fire on CASCADE)
ORDER BY 
    CASE 
        WHEN n.nspname = 'auth' AND c.relname = 'users' THEN 1
        WHEN c.relname IN ('profiles', 'tenant_users', 'team_members') THEN 2
        ELSE 3
    END,
    n.nspname, c.relname;

-- 3. Check if profiles or related tables have a description column
SELECT 
    'TABLES WITH DESCRIPTION COLUMN' as check_type,
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'description'
    AND table_schema IN ('public', 'auth')
ORDER BY table_schema, table_name;

-- 4. Check the specific update_invoice_totals function
SELECT 
    'UPDATE_INVOICE_TOTALS CHECK' as check_type,
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%NEW.%' AND prosrc LIKE '%DELETE%' THEN '❌ Uses NEW in DELETE context'
        WHEN prosrc LIKE '%NEW.%' THEN '⚠️ Uses NEW (check DELETE handling)'
        ELSE '✅ OK'
    END as issue,
    LEFT(prosrc, 500) as function_preview
FROM pg_proc 
WHERE proname = 'update_invoice_totals';

-- 5. Find triggers on auth.users
SELECT 
    'AUTH.USERS TRIGGERS' as check_type,
    tgname as trigger_name,
    proname as function_name,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN tgtype & 4 = 4 THEN 'INSERT'
        WHEN tgtype & 8 = 8 THEN 'DELETE'
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        WHEN tgtype & 28 = 28 THEN 'INSERT/UPDATE/DELETE'
        WHEN tgtype & 20 = 20 THEN 'INSERT/UPDATE'
        ELSE 'COMPLEX'
    END as events
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;