-- Safe Fix for Remaining Security Issues
-- This script safely addresses function search_path warnings and improves RLS policies

-- ========================================
-- 1. Fix Function Search Path Issues (Safe)
-- ========================================

-- Function to safely set search_path on functions
CREATE OR REPLACE FUNCTION fix_function_search_path(func_name text, arg_types text DEFAULT '') 
RETURNS void AS $$
DECLARE
    full_func_name text;
BEGIN
    -- Build full function name with arguments
    IF arg_types = '' THEN
        full_func_name := format('public.%I()', func_name);
    ELSE
        full_func_name := format('public.%I(%s)', func_name, arg_types);
    END IF;
    
    -- Check if function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = func_name
    ) THEN
        -- Set search_path
        EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_catalog', full_func_name);
        RAISE NOTICE 'Set search_path for function: %', func_name;
    ELSE
        RAISE NOTICE 'Function % does not exist, skipping', func_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error setting search_path for %: %', func_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Fix all functions
SELECT fix_function_search_path('generate_recurring_appointments');
SELECT fix_function_search_path('set_updated_at');
SELECT fix_function_search_path('update_updated_at_column');
SELECT fix_function_search_path('create_super_admin_user');
SELECT fix_function_search_path('create_tenant_for_user', 'uuid');
SELECT fix_function_search_path('update_automation_rules_updated_at');
SELECT fix_function_search_path('create_default_automation_rules', 'uuid');
SELECT fix_function_search_path('create_tenant_rls_policies', 'text');
SELECT fix_function_search_path('calculate_invoice_totals');
SELECT fix_function_search_path('update_invoice_totals');
SELECT fix_function_search_path('generate_invoice_number', 'uuid, text');

-- Clean up helper function
DROP FUNCTION fix_function_search_path(text, text);

-- ========================================
-- 2. Move Extensions to Separate Schema (Safe)
-- ========================================

DO $$
BEGIN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, service_role;
    
    -- Check and move pg_trgm
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Note: Moving extensions requires recreating them
        RAISE NOTICE 'Extension pg_trgm exists. To move it, run: DROP EXTENSION pg_trgm CASCADE; CREATE EXTENSION pg_trgm WITH SCHEMA extensions;';
    END IF;
    
    -- Check and move unaccent
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
        RAISE NOTICE 'Extension unaccent exists. To move it, run: DROP EXTENSION unaccent CASCADE; CREATE EXTENSION unaccent WITH SCHEMA extensions;';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error handling extensions: %', SQLERRM;
END $$;

-- ========================================
-- 3. Create Helper Function for Tenant ID (Safe)
-- ========================================

CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Try multiple tables to find tenant
    RETURN COALESCE(
        (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() LIMIT 1),
        (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1),
        (SELECT tenant_id FROM public.tenants WHERE created_by = auth.uid() LIMIT 1)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ========================================
-- 4. Improve RLS Policies (Safe)
-- ========================================

-- Function to safely replace basic policies
CREATE OR REPLACE FUNCTION replace_basic_rls_policy(
    table_name text,
    old_policy_name text,
    has_tenant_id boolean DEFAULT true
) RETURNS void AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
        RAISE NOTICE 'Table % does not exist, skipping', table_name;
        RETURN;
    END IF;
    
    -- Drop old policy if exists
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', old_policy_name, table_name);
    
    -- Create new policies based on whether table has tenant_id
    IF has_tenant_id THEN
        -- Check if tenant_id column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_name 
            AND column_name = 'tenant_id'
        ) THEN
            -- Create tenant-based policies
            EXECUTE format('CREATE POLICY "Users can view %s in their tenant" ON public.%I FOR SELECT USING (tenant_id = auth.user_tenant_id())', table_name, table_name);
            EXECUTE format('CREATE POLICY "Users can create %s in their tenant" ON public.%I FOR INSERT WITH CHECK (tenant_id = auth.user_tenant_id())', table_name, table_name);
            EXECUTE format('CREATE POLICY "Users can update %s in their tenant" ON public.%I FOR UPDATE USING (tenant_id = auth.user_tenant_id())', table_name, table_name);
            EXECUTE format('CREATE POLICY "Users can delete %s in their tenant" ON public.%I FOR DELETE USING (tenant_id = auth.user_tenant_id())', table_name, table_name);
            RAISE NOTICE 'Created tenant-based policies for table: %', table_name;
        ELSE
            RAISE NOTICE 'Table % does not have tenant_id column, keeping basic policy', table_name;
            -- Keep basic authenticated policy
            EXECUTE format('CREATE POLICY "%s_authenticated_access" ON public.%I FOR ALL TO authenticated USING (true)', table_name, table_name);
        END IF;
    ELSE
        -- Tables without tenant_id get specific policies
        EXECUTE format('CREATE POLICY "%s_authenticated_access" ON public.%I FOR ALL TO authenticated USING (true)', table_name, table_name);
        RAISE NOTICE 'Created basic authenticated policy for table: %', table_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating policies for %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Replace policies for tables with tenant_id
SELECT replace_basic_rls_policy('appointments', 'appointments_authenticated_access', true);
SELECT replace_basic_rls_policy('automation_rules', 'automation_rules_authenticated_access', true);
SELECT replace_basic_rls_policy('leads', 'leads_authenticated_access', true);
SELECT replace_basic_rls_policy('workflows', 'workflows_authenticated_access', true);
SELECT replace_basic_rls_policy('pipeline_stages', 'pipeline_stages_authenticated_access', true);

-- Special handling for related tables
DO $$
BEGIN
    -- Automation Executions (references automation_rules)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'automation_executions') THEN
        DROP POLICY IF EXISTS "automation_executions_authenticated_access" ON public.automation_executions;
        CREATE POLICY "Users can view automation executions in their tenant" ON public.automation_executions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.automation_rules ar
                    WHERE ar.id = rule_id AND ar.tenant_id = auth.user_tenant_id()
                )
            );
    END IF;
    
    -- Workflow related tables
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workflow_actions') THEN
        DROP POLICY IF EXISTS "workflow_actions_authenticated_access" ON public.workflow_actions;
        CREATE POLICY "Users can view workflow actions in their tenant" ON public.workflow_actions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.workflows w
                    WHERE w.id = workflow_id AND w.tenant_id = auth.user_tenant_id()
                )
            );
    END IF;
    
    -- Profiles (user-specific)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "profiles_authenticated_access" ON public.profiles;
        CREATE POLICY "Users can view their own profile" ON public.profiles
            FOR SELECT USING (user_id = auth.uid());
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (user_id = auth.uid());
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating special policies: %', SQLERRM;
END $$;

-- Clean up helper function
DROP FUNCTION replace_basic_rls_policy(text, text, boolean);

-- ========================================
-- 5. Create Performance Indexes (Safe)
-- ========================================

-- Function to safely create indexes
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
    index_name text,
    table_name text,
    column_name text
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name) THEN
        EXECUTE format('CREATE INDEX %I ON public.%I(%I)', index_name, table_name, column_name);
        RAISE NOTICE 'Created index: %', index_name;
    ELSE
        RAISE NOTICE 'Index % already exists', index_name;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating index %: %', index_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
SELECT create_index_if_not_exists('idx_appointments_tenant_id', 'appointments', 'tenant_id');
SELECT create_index_if_not_exists('idx_automation_rules_tenant_id', 'automation_rules', 'tenant_id');
SELECT create_index_if_not_exists('idx_leads_tenant_id', 'leads', 'tenant_id');
SELECT create_index_if_not_exists('idx_workflows_tenant_id', 'workflows', 'tenant_id');
SELECT create_index_if_not_exists('idx_campaigns_tenant_id', 'campaigns', 'tenant_id');
SELECT create_index_if_not_exists('idx_tenant_users_user_id', 'tenant_users', 'user_id');
SELECT create_index_if_not_exists('idx_profiles_user_id', 'profiles', 'user_id');

-- Clean up helper function
DROP FUNCTION create_index_if_not_exists(text, text, text);

-- ========================================
-- 6. Verification Queries
-- ========================================

-- Check functions have search_path set
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    p.proconfig AS configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proconfig IS NULL
ORDER BY p.proname;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
ORDER BY tablename;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;