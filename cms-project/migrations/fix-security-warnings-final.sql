-- Fix Security Warnings - Final Version
-- This migration fixes both function search paths and extension issues

-- ========================================
-- PART 1: Fix Function Search Paths
-- ========================================

-- Fix all functions with missing search_path
ALTER FUNCTION public.calculate_invoice_totals() SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_default_automation_rules(tenant_uuid uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_super_admin_user(user_email text) SET search_path = public, auth, pg_catalog;
ALTER FUNCTION public.create_tenant_for_user(p_user_id uuid, p_tenant_name text, p_tenant_slug text) SET search_path = public, auth, pg_catalog;
ALTER FUNCTION public.create_tenant_rls_policies(table_name text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.generate_invoice_number(p_tenant_id uuid, p_invoice_type character varying) SET search_path = public, pg_catalog;
ALTER FUNCTION public.generate_recurring_appointments(p_recurrence_id uuid, p_base_appointment jsonb, p_max_occurrences integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_user_tenant_id() SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_automation_rules_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_invoice_totals() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;

-- Verify functions are fixed
SELECT 
    p.proname AS function_name,
    p.proconfig AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'calculate_invoice_totals',
    'create_default_automation_rules',
    'create_super_admin_user',
    'create_tenant_for_user',
    'create_tenant_rls_policies',
    'generate_invoice_number',
    'generate_recurring_appointments',
    'get_user_tenant_id',
    'set_updated_at',
    'update_automation_rules_updated_at',
    'update_invoice_totals',
    'update_updated_at_column'
)
ORDER BY p.proname;

-- ========================================
-- PART 2: Handle Extensions
-- ========================================

-- Since we found functions using unaccent, we'll use a safer approach:
-- Add extensions schema to the database search_path instead of moving extensions

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Option 1: Add to database search_path (affects all connections)
-- This is the least disruptive option
ALTER DATABASE postgres SET search_path = "$user", public, extensions;

-- Option 2: If you want to move the extensions anyway (more secure but requires updating functions)
-- First, let's identify which functions use unaccent
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE 'Functions using unaccent that may need updating:';
    FOR func_record IN
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosrc LIKE '%unaccent%'
        AND n.nspname = 'public'
    LOOP
        RAISE NOTICE '- %.%(%)', func_record.schema_name, func_record.function_name, func_record.arguments;
    END LOOP;
END $$;

-- If you decide to move extensions later, you would:
-- 1. Update all functions to use extensions.unaccent() instead of unaccent()
-- 2. Then move the extensions:
/*
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION unaccent WITH SCHEMA extensions;
*/

-- ========================================
-- SUMMARY
-- ========================================
-- This migration:
-- 1. ✅ Sets search_path for all 12 functions to prevent SQL injection
-- 2. ✅ Creates extensions schema for future use
-- 3. ✅ Adds extensions to database search_path for compatibility
-- 
-- The extensions remain in public schema for now to avoid breaking existing functions.
-- You can move them later after updating all functions that use them.