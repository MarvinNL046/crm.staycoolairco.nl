-- Fix Extensions by Moving Them (Aggressive Approach)
-- Only use this if you're ready to update all functions using unaccent

-- Step 1: Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Step 2: Check current state
SELECT 
    e.extname AS extension_name,
    n.nspname AS current_schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('pg_trgm', 'unaccent');

-- Step 3: Backup function definitions that use unaccent
-- This creates a backup of functions before modifying them
CREATE TABLE IF NOT EXISTS _function_backup_before_extension_move AS
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition,
    now() AS backed_up_at
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%unaccent%'
AND n.nspname = 'public';

-- Step 4: Move extensions
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION unaccent WITH SCHEMA extensions;

DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

-- Step 5: Update all functions to use extensions.unaccent
-- Since unaccent_init, unaccent_lexize, and unaccent functions exist, 
-- we need to check which public functions actually use unaccent

-- First, let's see what broke
DO $$
DECLARE
    func_record RECORD;
    new_definition TEXT;
BEGIN
    FOR func_record IN
        SELECT 
            schema_name,
            function_name,
            arguments,
            definition
        FROM _function_backup_before_extension_move
    LOOP
        -- Simple replacement of unaccent with extensions.unaccent
        new_definition := replace(func_record.definition, 'unaccent(', 'extensions.unaccent(');
        
        -- Also update the search_path in the function
        IF new_definition NOT LIKE '%SET search_path%' THEN
            new_definition := regexp_replace(
                new_definition, 
                '(LANGUAGE \w+)(;?)$', 
                '\1 SET search_path = public, extensions, pg_catalog\2'
            );
        ELSE
            -- Add extensions to existing search_path
            new_definition := regexp_replace(
                new_definition,
                'SET search_path = ([^;]+)',
                'SET search_path = \1, extensions'
            );
        END IF;
        
        BEGIN
            EXECUTE new_definition;
            RAISE NOTICE 'Updated function: %.%', func_record.schema_name, func_record.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to update %.%: %', func_record.schema_name, func_record.function_name, SQLERRM;
            RAISE NOTICE 'You may need to manually update this function';
        END;
    END LOOP;
END $$;

-- Step 6: Verify everything is working
-- Test unaccent
SELECT extensions.unaccent('café') = 'cafe' AS unaccent_works;

-- Test pg_trgm
SELECT extensions.similarity('hello', 'hallo') > 0 AS pg_trgm_works;

-- Step 7: Check if any indexes need to be recreated
SELECT 
    'Indexes that may need recreation:' AS note,
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE indexdef LIKE '%gin_trgm_ops%' 
   OR indexdef LIKE '%gist_trgm_ops%';

-- Note: If you have indexes using pg_trgm, you'll need to:
-- 1. Drop the old index: DROP INDEX idx_name;
-- 2. Recreate with extensions schema: CREATE INDEX idx_name ON table USING gin (column extensions.gin_trgm_ops);