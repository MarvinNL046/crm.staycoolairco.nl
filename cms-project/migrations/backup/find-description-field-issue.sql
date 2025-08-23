-- Find the trigger causing "description" field error on user deletion

BEGIN;

-- 1. List all functions that reference "description"
DO $$
DECLARE
    func_rec RECORD;
    func_def TEXT;
BEGIN
    RAISE NOTICE 'Functions referencing description field:';
    FOR func_rec IN 
        SELECT n.nspname, p.proname, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'auth')
    LOOP
        func_def := pg_get_functiondef(func_rec.oid);
        IF func_def LIKE '%description%' THEN
            IF func_def LIKE '%NEW.description%' THEN
                RAISE NOTICE '❌ FOUND ISSUE: %.% uses NEW.description', func_rec.nspname, func_rec.proname;
            ELSIF func_def LIKE '%OLD.description%' THEN
                RAISE NOTICE '⚠️ %.% uses OLD.description', func_rec.nspname, func_rec.proname;
            ELSE
                RAISE NOTICE '📝 %.% references description', func_rec.nspname, func_rec.proname;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 2. Check the specific update_invoice_totals function
\echo 'Checking update_invoice_totals function:'
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_invoice_totals'
LIMIT 1;

-- 3. Find all DELETE triggers
\echo 'All DELETE triggers in the system:'
SELECT 
    n.nspname || '.' || c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE (tgtype & 8 = 8) -- DELETE triggers
ORDER BY n.nspname, c.relname;

-- 4. Check triggers on auth.users specifically
\echo 'Triggers on auth.users table:'
SELECT 
    tgname as trigger_name,
    proname as function_name,
    CASE 
        WHEN tgtype & 8 = 8 THEN 'Fires on DELETE'
        WHEN tgtype & 16 = 16 THEN 'Fires on UPDATE'
        WHEN tgtype & 4 = 4 THEN 'Fires on INSERT'
        ELSE 'Multiple events'
    END as trigger_event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- 5. Look for cascade delete issues on profiles
\echo 'Checking profiles table structure:'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('description', 'bio', 'about', 'notes')
ORDER BY ordinal_position;

ROLLBACK;