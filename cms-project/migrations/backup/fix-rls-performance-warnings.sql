-- Fix RLS Performance Warnings by wrapping auth functions in subqueries
-- This prevents re-evaluation of auth functions for each row

BEGIN;

-- First, let's identify all policies that need fixing
CREATE TEMP TABLE policies_to_fix AS
SELECT 
    schemaname,
    tablename,
    policyname,
    pg_get_expr(polqual, polrelid) as policy_expression,
    polcmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    pg_get_expr(polqual, polrelid) LIKE '%auth.uid()%'
    OR pg_get_expr(polqual, polrelid) LIKE '%auth.jwt()%'
    OR pg_get_expr(polqual, polrelid) LIKE '%auth.role()%'
    OR pg_get_expr(polqual, polrelid) LIKE '%current_setting%'
  )
  AND NOT pg_get_expr(polqual, polrelid) LIKE '%(select auth.%'
ORDER BY tablename, policyname;

-- Display policies that will be fixed
SELECT tablename, policyname, 
       CASE 
         WHEN policy_expression LIKE '%auth.uid()%' THEN 'Uses auth.uid()'
         WHEN policy_expression LIKE '%auth.jwt()%' THEN 'Uses auth.jwt()'
         WHEN policy_expression LIKE '%auth.role()%' THEN 'Uses auth.role()'
         WHEN policy_expression LIKE '%current_setting%' THEN 'Uses current_setting()'
       END as issue
FROM policies_to_fix;

-- Function to fix a single policy
CREATE OR REPLACE FUNCTION fix_rls_policy(
    p_schema text,
    p_table text,
    p_policy text
) RETURNS void AS $$
DECLARE
    v_policy_def text;
    v_new_def text;
    v_roles text;
    v_cmd text;
    v_permissive boolean;
    v_with_check text;
BEGIN
    -- Get the current policy definition
    SELECT 
        pg_get_expr(polqual, polrelid),
        polroles::regrole[],
        polcmd,
        polpermissive,
        pg_get_expr(polwithcheck, polrelid)
    INTO v_policy_def, v_roles, v_cmd, v_permissive, v_with_check
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = p_schema
      AND c.relname = p_table
      AND pol.polname = p_policy;
    
    -- Replace auth functions with subqueries
    v_new_def := v_policy_def;
    v_new_def := regexp_replace(v_new_def, '\bauth\.uid\(\)', '(select auth.uid())', 'g');
    v_new_def := regexp_replace(v_new_def, '\bauth\.jwt\(\)', '(select auth.jwt())', 'g');
    v_new_def := regexp_replace(v_new_def, '\bauth\.role\(\)', '(select auth.role())', 'g');
    
    -- Only proceed if changes were made
    IF v_new_def != v_policy_def THEN
        -- Drop the old policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p_policy, p_schema, p_table);
        
        -- Recreate with optimized version
        IF v_with_check IS NOT NULL THEN
            v_with_check := regexp_replace(v_with_check, '\bauth\.uid\(\)', '(select auth.uid())', 'g');
            v_with_check := regexp_replace(v_with_check, '\bauth\.jwt\(\)', '(select auth.jwt())', 'g');
            v_with_check := regexp_replace(v_with_check, '\bauth\.role\(\)', '(select auth.role())', 'g');
        END IF;
        
        -- Build the new policy
        EXECUTE format(
            'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s USING (%s) %s',
            p_policy,
            p_schema,
            p_table,
            CASE WHEN v_permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
            CASE v_cmd
                WHEN 'r' THEN 'SELECT'
                WHEN 'a' THEN 'INSERT'
                WHEN 'w' THEN 'UPDATE'
                WHEN 'd' THEN 'DELETE'
                ELSE 'ALL'
            END,
            array_to_string(v_roles::text[], ', '),
            v_new_def,
            CASE WHEN v_with_check IS NOT NULL THEN format('WITH CHECK (%s)', v_with_check) ELSE '' END
        );
        
        RAISE NOTICE 'Fixed policy % on table %.%', p_policy, p_schema, p_table;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix all identified policies
DO $$
DECLARE
    v_record RECORD;
BEGIN
    FOR v_record IN SELECT DISTINCT schemaname, tablename, policyname FROM policies_to_fix
    LOOP
        PERFORM fix_rls_policy(v_record.schemaname, v_record.tablename, v_record.policyname);
    END LOOP;
END $$;

-- Clean up
DROP FUNCTION IF EXISTS fix_rls_policy(text, text, text);
DROP TABLE IF EXISTS policies_to_fix;

-- Verify the fixes
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN pg_get_expr(polqual, polrelid) LIKE '%(select auth.uid())%' THEN '✅ Fixed'
        WHEN pg_get_expr(polqual, polrelid) LIKE '%auth.uid()%' THEN '❌ Needs fixing'
        ELSE '✅ OK'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename IN (
    'activities', 'expenses', 'platform_settings', 'super_admins',
    'system_audit_log', 'tasks', 'team_members', 'tenant_users',
    'user_tenants', 'profiles', 'tenants', 'leads', 'contacts',
    'customers', 'companies', 'invoices', 'invoice_items',
    'appointments', 'products', 'btw_percentages', 'tags',
    'email_templates', 'campaigns', 'campaign_metrics',
    'pipeline_stages', 'workflows', 'workflow_templates',
    'workflow_steps', 'workflow_executions', 'automation_rules',
    'automation_logs', 'api_keys', 'webhook_logs', 'email_logs',
    'appointment_reminders', 'recurring_appointments'
  ))
ORDER BY tablename, policyname;

COMMIT;