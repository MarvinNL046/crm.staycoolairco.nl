-- Find the source of "description" field error - simplified version

-- 1. Check triggers on auth.users
SELECT 
    'AUTH.USERS TRIGGERS' as section,
    tgname as trigger_name,
    tgtype
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- 2. Check if any table has a description column
SELECT 
    'TABLES WITH DESCRIPTION' as section,
    table_schema,
    table_name
FROM information_schema.columns
WHERE column_name = 'description'
    AND table_schema IN ('public', 'auth');

-- 3. Find trigger functions that might be problematic
SELECT 
    'TRIGGER FUNCTIONS' as section,
    p.proname as function_name,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
    'update_invoice_totals',
    'update_profile_on_auth_change',
    'update_leads_search_fts'
)
OR p.proname LIKE '%audit%'
OR p.proname LIKE '%log%'
ORDER BY n.nspname, p.proname;

-- 4. Get the actual function definition that might have the issue
SELECT 
    'FUNCTION DEFINITIONS' as section,
    proname,
    substring(prosrc, 1, 200) as first_200_chars
FROM pg_proc
WHERE proname IN (
    SELECT DISTINCT p.proname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
);

-- 5. Check for audit/log related triggers
SELECT 
    'AUDIT TRIGGERS' as section,
    c.relname as table_name,
    t.tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname LIKE '%audit%' 
   OR t.tgname LIKE '%log%'
   OR c.relname LIKE '%audit%'
   OR c.relname LIKE '%log%';