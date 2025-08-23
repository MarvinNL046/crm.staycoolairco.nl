-- Check system_audit_log structure and find the description field issue

-- 1. Check system_audit_log columns
SELECT 
    'SYSTEM_AUDIT_LOG COLUMNS' as check,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'system_audit_log'
ORDER BY ordinal_position;

-- 2. Check if there are any custom triggers on system_audit_log (not RI constraints)
SELECT 
    'CUSTOM TRIGGERS ON AUDIT LOG' as check,
    tgname as trigger_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.system_audit_log'::regclass
    AND tgname NOT LIKE 'RI_ConstraintTrigger%';

-- 3. Check for any audit-related functions
SELECT 
    'AUDIT FUNCTIONS' as check,
    proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND (
        proname LIKE '%audit%' 
        OR proname LIKE '%log%'
    )
    AND proname NOT IN ('update_email_logs_updated_at', 'update_sms_logs_updated_at');

-- 4. Look for the actual error - check if there's a function trying to log deletions
SELECT 
    'DELETION LOG FUNCTIONS' as check,
    proname as function_name,
    CASE 
        WHEN prosrc LIKE '%NEW.description%' THEN '❌ FOUND: Uses NEW.description'
        WHEN prosrc LIKE '%description%' THEN '⚠️ References description'
        ELSE '✅ No description reference'
    END as issue
FROM pg_proc
WHERE proname IN (
    SELECT DISTINCT proname 
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE tgrelid IN (
        'auth.users'::regclass,
        'public.profiles'::regclass,
        'public.system_audit_log'::regclass
    )
);

-- 5. Check if there's a trigger that logs user actions
SELECT 
    'USER ACTION TRIGGERS' as check,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname LIKE '%user%' 
   OR p.proname LIKE '%profile%'
   OR t.tgname LIKE '%user%'
   OR t.tgname LIKE '%profile%'
ORDER BY c.relname, t.tgname;