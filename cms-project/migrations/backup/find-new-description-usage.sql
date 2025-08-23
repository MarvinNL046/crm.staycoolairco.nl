-- Direct search for NEW.description usage in all functions

-- Search all function bodies for NEW.description
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    'FOUND NEW.description usage' as issue
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE prosrc LIKE '%NEW.description%';

-- Also check for functions that might be called during DELETE
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN prosrc LIKE '%NEW.description%' THEN '❌ Uses NEW.description'
        WHEN prosrc LIKE '%NEW.%' AND p.proname IN (
            SELECT DISTINCT proname 
            FROM pg_trigger t
            JOIN pg_proc p2 ON t.tgfoid = p2.oid
            WHERE (tgtype & 8 = 8) -- DELETE triggers
        ) THEN '⚠️ DELETE trigger uses NEW'
        ELSE 'Check manually'
    END as potential_issue
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.oid IN (
    SELECT DISTINCT tgfoid 
    FROM pg_trigger 
    WHERE (tgtype & 8 = 8) -- DELETE triggers
);

-- Check if the error might be in a CHECK constraint or DEFAULT value
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class c ON con.conrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE pg_get_constraintdef(con.oid) LIKE '%description%';

-- Final check: Get ALL functions that could be involved in user deletion
SELECT 
    'ALL DELETE-RELATED FUNCTIONS' as check,
    p.proname,
    substring(p.prosrc, position('NEW.description' in p.prosrc) - 50, 150) as context
FROM pg_proc p
WHERE p.prosrc LIKE '%NEW.description%';