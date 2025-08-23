-- Fix Security Warnings
-- This migration fixes function search path and extension schema issues

-- Part 1: Fix Function Search Path Mutable warnings
-- Set search_path for all functions to prevent SQL injection vulnerabilities

-- Fix generate_recurring_appointments function
ALTER FUNCTION public.generate_recurring_appointments() SET search_path = public, pg_catalog;

-- Fix get_user_tenant_id function
ALTER FUNCTION public.get_user_tenant_id() SET search_path = public, pg_catalog;

-- Fix set_updated_at function
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_catalog;

-- Fix update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;

-- Fix create_super_admin_user function
ALTER FUNCTION public.create_super_admin_user(email text, password text) SET search_path = public, auth, pg_catalog;

-- Fix create_tenant_for_user function
ALTER FUNCTION public.create_tenant_for_user() SET search_path = public, auth, pg_catalog;

-- Fix update_automation_rules_updated_at function
ALTER FUNCTION public.update_automation_rules_updated_at() SET search_path = public, pg_catalog;

-- Fix create_default_automation_rules function
ALTER FUNCTION public.create_default_automation_rules(p_tenant_id uuid) SET search_path = public, pg_catalog;

-- Fix create_tenant_rls_policies function
ALTER FUNCTION public.create_tenant_rls_policies() SET search_path = public, pg_catalog;

-- Fix calculate_invoice_totals function
ALTER FUNCTION public.calculate_invoice_totals(invoice_id uuid) SET search_path = public, pg_catalog;

-- Fix update_invoice_totals function
ALTER FUNCTION public.update_invoice_totals() SET search_path = public, pg_catalog;

-- Fix generate_invoice_number function
ALTER FUNCTION public.generate_invoice_number(p_tenant_id uuid, p_type text) SET search_path = public, pg_catalog;

-- Part 2: Move extensions from public schema to a dedicated extensions schema
-- This improves security by isolating extensions from user data

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_trgm extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

-- Move unaccent extension
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION unaccent WITH SCHEMA extensions;

-- Update any functions or queries that use these extensions
-- They will need to reference extensions.function_name instead of just function_name

-- Example: If you have any indexes using pg_trgm, recreate them
-- This is a template - adjust based on your actual usage
/*
-- Example for text search indexes using pg_trgm
DROP INDEX IF EXISTS idx_customers_name_trgm;
CREATE INDEX idx_customers_name_trgm ON public.customers 
USING gin (name extensions.gin_trgm_ops);

-- Example for unaccent usage in a function
CREATE OR REPLACE FUNCTION public.search_customers(search_term text)
RETURNS SETOF customers AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM customers
    WHERE extensions.unaccent(name) ILIKE '%' || extensions.unaccent(search_term) || '%';
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions, pg_catalog;
*/

-- Add comments explaining the security improvements
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions, isolated from user data for security';

-- Note: After running this migration, you may need to update your application code
-- to use the extensions schema when calling extension functions directly
-- For example: extensions.unaccent() instead of unaccent()
-- Or add 'extensions' to your application's search_path