-- Fix Extensions in Public Schema
-- This migration moves pg_trgm and unaccent extensions to a dedicated schema

-- Step 1: Check current extension status
SELECT 
    e.extname AS extension_name,
    n.nspname AS current_schema,
    e.extversion AS version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname IN ('pg_trgm', 'unaccent');

-- Step 2: Check for dependencies before moving
-- Check for indexes using pg_trgm
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexdef LIKE '%gin_trgm_ops%' 
   OR indexdef LIKE '%gist_trgm_ops%';

-- Check for functions using unaccent
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%unaccent%'
AND n.nspname NOT IN ('pg_catalog', 'information_schema');

-- Step 3: Create extensions schema and move extensions
-- IMPORTANT: Only run this if you've checked dependencies above!

-- Create schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Option A: If you have NO dependencies, you can safely move the extensions:
/*
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION unaccent WITH SCHEMA extensions;
*/

-- Option B: If you have dependencies, you need to handle them first
-- Example for recreating an index:
/*
-- Drop old index
DROP INDEX IF EXISTS idx_customers_name_trgm;

-- Move extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

-- Recreate index with new schema
CREATE INDEX idx_customers_name_trgm ON public.customers 
USING gin (name extensions.gin_trgm_ops);
*/

-- Option C: Add extensions schema to search_path instead of moving
-- This is less disruptive but provides less isolation
/*
ALTER DATABASE postgres SET search_path = public, extensions;
-- Or for specific roles:
ALTER ROLE authenticated SET search_path = public, extensions;
ALTER ROLE anon SET search_path = public, extensions;
*/

-- Step 4: Update functions that use unaccent
-- Example template for updating a function:
/*
CREATE OR REPLACE FUNCTION public.search_customers(search_term text)
RETURNS SETOF customers AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM customers
    WHERE extensions.unaccent(lower(name)) ILIKE '%' || extensions.unaccent(lower(search_term)) || '%';
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions, pg_catalog;
*/

-- Step 5: Verify extensions are working correctly
-- Test pg_trgm:
-- SELECT extensions.similarity('hello', 'hallo');

-- Test unaccent:
-- SELECT extensions.unaccent('café');