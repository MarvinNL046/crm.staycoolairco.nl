-- Fix Security Warnings (Safe Version)
-- This migration fixes function search path and extension schema issues
-- It first checks if functions exist before trying to alter them

-- Part 1: Fix Function Search Path Mutable warnings
-- Set search_path for all functions to prevent SQL injection vulnerabilities

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Fix functions that exist in the database
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments,
            p.oid
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
    LOOP
        -- Determine appropriate search_path based on function name
        IF func_record.function_name IN ('create_super_admin_user', 'create_tenant_for_user') THEN
            -- These functions might need auth schema
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, auth, pg_catalog',
                func_record.function_name, func_record.arguments);
        ELSE
            -- Standard functions only need public and pg_catalog
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_catalog',
                func_record.function_name, func_record.arguments);
        END IF;
        
        RAISE NOTICE 'Fixed search_path for function: %(%)', func_record.function_name, func_record.arguments;
    END LOOP;
END $$;

-- Part 2: Move extensions from public schema to a dedicated extensions schema
-- First check if extensions exist before trying to move them

DO $$
BEGIN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Grant usage on extensions schema to necessary roles
    GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
    
    -- Check and move pg_trgm if it exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Check if there are any dependencies we need to handle
        IF EXISTS (
            SELECT 1 FROM pg_depend d
            JOIN pg_extension e ON d.objid = e.oid
            WHERE e.extname = 'pg_trgm'
            AND d.deptype = 'n'
        ) THEN
            RAISE NOTICE 'pg_trgm has dependencies - manual intervention may be required';
            -- You might need to drop and recreate indexes manually
        ELSE
            DROP EXTENSION IF EXISTS pg_trgm CASCADE;
            CREATE EXTENSION pg_trgm WITH SCHEMA extensions;
            RAISE NOTICE 'Moved pg_trgm to extensions schema';
        END IF;
    END IF;
    
    -- Check and move unaccent if it exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
        -- Check if there are any dependencies we need to handle
        IF EXISTS (
            SELECT 1 FROM pg_depend d
            JOIN pg_extension e ON d.objid = e.oid
            WHERE e.extname = 'unaccent'
            AND d.deptype = 'n'
        ) THEN
            RAISE NOTICE 'unaccent has dependencies - manual intervention may be required';
        ELSE
            DROP EXTENSION IF EXISTS unaccent CASCADE;
            CREATE EXTENSION unaccent WITH SCHEMA extensions;
            RAISE NOTICE 'Moved unaccent to extensions schema';
        END IF;
    END IF;
END $$;

-- Add comments explaining the security improvements
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions, isolated from user data for security';

-- Display summary of what needs manual attention
DO $$
DECLARE
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Check for indexes using pg_trgm
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexdef LIKE '%gin_trgm_ops%' 
    OR indexdef LIKE '%gist_trgm_ops%';
    
    IF index_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'IMPORTANT: Found % indexes using pg_trgm that may need to be recreated', index_count;
        RAISE NOTICE 'Run the following query to see affected indexes:';
        RAISE NOTICE 'SELECT schemaname, tablename, indexname FROM pg_indexes WHERE indexdef LIKE ''%%trgm_ops%%'';';
    END IF;
    
    -- Check for functions using unaccent
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosrc LIKE '%unaccent%';
    
    IF function_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE 'IMPORTANT: Found % functions using unaccent that may need updating', function_count;
        RAISE NOTICE 'Run the following query to see affected functions:';
        RAISE NOTICE 'SELECT proname FROM pg_proc WHERE prosrc LIKE ''%%unaccent%%'';';
    END IF;
END $$;