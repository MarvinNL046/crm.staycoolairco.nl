-- Fix user deletion error: record "new" has no field "description"

-- First, find all triggers that might be causing this issue
SELECT 
    'TRIGGERS ON AUTH.USERS' as check_type,
    tgname as trigger_name,
    proname as function_name,
    tgtype,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN tgtype & 4 = 4 THEN 'INSERT'
        WHEN tgtype & 8 = 8 THEN 'DELETE'
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'MULTIPLE'
    END as event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- Check trigger functions that might reference "description"
SELECT 
    'TRIGGER FUNCTIONS WITH ISSUES' as check_type,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
    SELECT DISTINCT proname 
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE tgrelid = 'auth.users'::regclass
)
AND pg_get_functiondef(p.oid) LIKE '%description%';

-- Check if there's a problematic trigger on profiles or related tables
SELECT 
    'TRIGGERS REFERENCING DESCRIPTION' as check_type,
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE pg_get_functiondef(p.oid) LIKE '%description%'
    AND (n.nspname = 'auth' OR n.nspname = 'public')
ORDER BY n.nspname, c.relname, t.tgname;

-- Look for any trigger that fires on DELETE and uses NEW record
SELECT 
    'DELETE TRIGGERS USING NEW' as check_type,
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%NEW.description%' THEN '❌ Uses NEW.description'
        WHEN pg_get_functiondef(p.oid) LIKE '%NEW.%' AND (tgtype & 8 = 8) THEN '⚠️ Uses NEW in DELETE trigger'
        ELSE '✅ OK'
    END as issue
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE (tgtype & 8 = 8) -- DELETE triggers
    AND pg_get_functiondef(p.oid) LIKE '%NEW.%'
ORDER BY n.nspname, c.relname, t.tgname;