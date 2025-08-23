-- Fix Security Issues - Public Schema Only Version
-- This version only uses the public schema and doesn't require auth schema access

-- ========================================
-- 1. Fix Function Search Path Issues
-- ========================================

-- Helper function to safely fix search paths
DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
BEGIN
    -- Loop through all functions that need fixing
    FOR func_record IN 
        SELECT 
            p.proname AS func_name,
            pg_get_function_identity_arguments(p.oid) AS func_args,
            p.proconfig AS config
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'generate_recurring_appointments',
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
        -- Build function signature
        IF func_record.func_args = '' THEN
            func_signature := format('public.%I()', func_record.func_name);
        ELSE
            func_signature := format('public.%I(%s)', func_record.func_name, func_record.func_args);
        END IF;
        
        -- Set search_path if not already set
        IF func_record.config IS NULL OR NOT 'search_path' = ANY(func_record.config) THEN
            BEGIN
                EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_catalog', func_signature);
                RAISE NOTICE 'Fixed search_path for function: %', func_signature;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not fix function %: %', func_signature, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- ========================================
-- 2. Create Helper Function for Getting User's Tenant
-- ========================================

-- Create a helper function in public schema to get user's tenant
CREATE OR REPLACE FUNCTION public.get_auth_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the current user's ID from auth.uid()
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to find tenant from various tables
    RETURN COALESCE(
        (SELECT tenant_id FROM public.tenant_users WHERE user_id = user_id LIMIT 1),
        (SELECT tenant_id FROM public.user_tenants WHERE user_id = user_id LIMIT 1),
        (SELECT tenant_id FROM public.team_members WHERE user_id = user_id LIMIT 1)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_user_tenant_id() TO authenticated;

-- ========================================
-- 3. Fix RLS Policies - Replace Basic with Tenant-Based
-- ========================================

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Fix Appointments policies
DO $$
BEGIN
    -- Drop old policy
    DROP POLICY IF EXISTS "appointments_authenticated_access" ON public.appointments;
    
    -- Create new tenant-based policies
    CREATE POLICY "Users can view appointments in their tenant" ON public.appointments
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    CREATE POLICY "Users can create appointments in their tenant" ON public.appointments
        FOR INSERT WITH CHECK (tenant_id = public.get_auth_user_tenant_id());
    
    CREATE POLICY "Users can update appointments in their tenant" ON public.appointments
        FOR UPDATE USING (tenant_id = public.get_auth_user_tenant_id());
    
    CREATE POLICY "Users can delete appointments in their tenant" ON public.appointments
        FOR DELETE USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    RAISE NOTICE 'Fixed policies for appointments table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing appointments policies: %', SQLERRM;
END $$;

-- Fix Automation Rules policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "automation_rules_authenticated_access" ON public.automation_rules;
    
    CREATE POLICY "Users can view automation rules in their tenant" ON public.automation_rules
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    CREATE POLICY "Users can manage automation rules in their tenant" ON public.automation_rules
        FOR ALL USING (tenant_id = public.get_auth_user_tenant_id());
    
    RAISE NOTICE 'Fixed policies for automation_rules table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing automation_rules policies: %', SQLERRM;
END $$;

-- Fix Automation Executions policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "automation_executions_authenticated_access" ON public.automation_executions;
    
    CREATE POLICY "Users can view automation executions in their tenant" ON public.automation_executions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.automation_rules ar
                WHERE ar.id = automation_executions.rule_id 
                AND ar.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    RAISE NOTICE 'Fixed policies for automation_executions table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing automation_executions policies: %', SQLERRM;
END $$;

-- Fix Leads policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "leads_authenticated_access" ON public.leads;
    
    CREATE POLICY "Users can view leads in their tenant" ON public.leads
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    CREATE POLICY "Users can create leads in their tenant" ON public.leads
        FOR INSERT WITH CHECK (tenant_id = public.get_auth_user_tenant_id());
    
    CREATE POLICY "Users can update leads in their tenant" ON public.leads
        FOR UPDATE USING (tenant_id = public.get_auth_user_tenant_id());
    
    CREATE POLICY "Users can delete leads in their tenant" ON public.leads
        FOR DELETE USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    RAISE NOTICE 'Fixed policies for leads table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing leads policies: %', SQLERRM;
END $$;

-- Fix Workflows policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "workflows_authenticated_access" ON public.workflows;
    
    CREATE POLICY "Users can view workflows in their tenant" ON public.workflows
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    CREATE POLICY "Users can manage workflows in their tenant" ON public.workflows
        FOR ALL USING (tenant_id = public.get_auth_user_tenant_id());
    
    RAISE NOTICE 'Fixed policies for workflows table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing workflows policies: %', SQLERRM;
END $$;

-- Fix Workflow-related tables
DO $$
BEGIN
    -- Workflow Actions
    DROP POLICY IF EXISTS "workflow_actions_authenticated_access" ON public.workflow_actions;
    CREATE POLICY "Users can view workflow actions in their tenant" ON public.workflow_actions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.workflows w
                WHERE w.id = workflow_actions.workflow_id 
                AND w.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    -- Workflow Executions
    DROP POLICY IF EXISTS "workflow_executions_authenticated_access" ON public.workflow_executions;
    CREATE POLICY "Users can view workflow executions in their tenant" ON public.workflow_executions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.workflows w
                WHERE w.id = workflow_executions.workflow_id 
                AND w.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    -- Workflow Triggers
    DROP POLICY IF EXISTS "workflow_triggers_authenticated_access" ON public.workflow_triggers;
    CREATE POLICY "Users can view workflow triggers in their tenant" ON public.workflow_triggers
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.workflows w
                WHERE w.id = workflow_triggers.workflow_id 
                AND w.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    RAISE NOTICE 'Fixed policies for workflow-related tables';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing workflow-related policies: %', SQLERRM;
END $$;

-- Fix Campaign-related tables
DO $$
BEGIN
    -- Campaign Recipients
    DROP POLICY IF EXISTS "campaign_recipients_authenticated_access" ON public.campaign_recipients;
    CREATE POLICY "Users can view campaign recipients in their tenant" ON public.campaign_recipients
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_recipients.campaign_id 
                AND c.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    -- Campaign Links
    DROP POLICY IF EXISTS "campaign_links_authenticated_access" ON public.campaign_links;
    CREATE POLICY "Users can view campaign links in their tenant" ON public.campaign_links
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_links.campaign_id 
                AND c.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    -- Campaign Clicks
    DROP POLICY IF EXISTS "campaign_clicks_authenticated_access" ON public.campaign_clicks;
    CREATE POLICY "Users can view campaign clicks in their tenant" ON public.campaign_clicks
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.campaign_links cl
                JOIN public.campaigns c ON c.id = cl.campaign_id
                WHERE cl.id = campaign_clicks.link_id 
                AND c.tenant_id = public.get_auth_user_tenant_id()
            )
            OR public.is_super_admin()
        );
    
    RAISE NOTICE 'Fixed policies for campaign-related tables';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing campaign-related policies: %', SQLERRM;
END $$;

-- Fix other tables
DO $$
BEGIN
    -- Pipeline Stages
    DROP POLICY IF EXISTS "pipeline_stages_authenticated_access" ON public.pipeline_stages;
    CREATE POLICY "Users can view pipeline stages in their tenant" ON public.pipeline_stages
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    CREATE POLICY "Users can manage pipeline stages in their tenant" ON public.pipeline_stages
        FOR ALL USING (tenant_id = public.get_auth_user_tenant_id());
    
    -- Profiles (user-specific)
    DROP POLICY IF EXISTS "profiles_authenticated_access" ON public.profiles;
    CREATE POLICY "Users can view their own profile" ON public.profiles
        FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (user_id = auth.uid());
    
    -- Tenant Users
    DROP POLICY IF EXISTS "tenant_users_authenticated_access" ON public.tenant_users;
    CREATE POLICY "Users can view tenant users in their tenant" ON public.tenant_users
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    -- System Audit Log
    DROP POLICY IF EXISTS "system_audit_log_authenticated_access" ON public.system_audit_log;
    CREATE POLICY "Users can view audit logs for their tenant" ON public.system_audit_log
        FOR SELECT USING (tenant_id = public.get_auth_user_tenant_id() OR public.is_super_admin());
    
    -- Super Admins (restricted)
    DROP POLICY IF EXISTS "super_admins_authenticated_access" ON public.super_admins;
    CREATE POLICY "Only super admins can access super_admins table" ON public.super_admins
        FOR ALL USING (public.is_super_admin());
    
    -- Platform Settings (super admin only)
    DROP POLICY IF EXISTS "platform_settings_authenticated_access" ON public.platform_settings;
    CREATE POLICY "Only super admins can access platform settings" ON public.platform_settings
        FOR ALL USING (public.is_super_admin());
    
    -- Message Outbox (service role only)
    DROP POLICY IF EXISTS "message_outbox_authenticated_access" ON public.message_outbox;
    CREATE POLICY "Only service role can access message outbox" ON public.message_outbox
        FOR ALL USING (auth.jwt()->>'role' = 'service_role');
    
    -- Workflow Templates
    DROP POLICY IF EXISTS "workflow_templates_authenticated_access" ON public.workflow_templates;
    CREATE POLICY "Anyone can view workflow templates" ON public.workflow_templates
        FOR SELECT USING (true);
    CREATE POLICY "Only super admins can manage workflow templates" ON public.workflow_templates
        FOR INSERT USING (public.is_super_admin());
    CREATE POLICY "Only super admins can update workflow templates" ON public.workflow_templates
        FOR UPDATE USING (public.is_super_admin());
    CREATE POLICY "Only super admins can delete workflow templates" ON public.workflow_templates
        FOR DELETE USING (public.is_super_admin());
    
    RAISE NOTICE 'Fixed policies for remaining tables';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing remaining policies: %', SQLERRM;
END $$;

-- ========================================
-- 4. Create Indexes for Performance
-- ========================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON public.automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON public.campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant_id ON public.pipeline_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id) WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_tenants');
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id) WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'team_members');

-- ========================================
-- 5. Handle Extensions (Information Only)
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'EXTENSION HANDLING';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Extensions pg_trgm and unaccent are in the public schema.';
    RAISE NOTICE 'To move them to a separate schema, you need database owner permissions.';
    RAISE NOTICE 'Ask your database administrator to run:';
    RAISE NOTICE '';
    RAISE NOTICE 'CREATE SCHEMA IF NOT EXISTS extensions;';
    RAISE NOTICE 'GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, service_role;';
    RAISE NOTICE 'DROP EXTENSION pg_trgm CASCADE;';
    RAISE NOTICE 'CREATE EXTENSION pg_trgm WITH SCHEMA extensions;';
    RAISE NOTICE 'DROP EXTENSION unaccent CASCADE;';
    RAISE NOTICE 'CREATE EXTENSION unaccent WITH SCHEMA extensions;';
    RAISE NOTICE '';
END $$;

-- ========================================
-- 6. Verification Queries
-- ========================================

-- Check functions with search_path
SELECT 
    'Function Search Path Status:' as check_type,
    COUNT(*) FILTER (WHERE proconfig IS NULL OR NOT 'search_path' = ANY(proconfig)) as issues_remaining,
    COUNT(*) FILTER (WHERE proconfig IS NOT NULL AND 'search_path' = ANY(proconfig)) as issues_fixed
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'generate_recurring_appointments',
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
);

-- Check RLS policies
SELECT 
    'RLS Policy Status:' as check_type,
    COUNT(DISTINCT tablename) as tables_with_policies,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';

-- List remaining basic policies
SELECT 
    'Tables still using basic authenticated access:' as info,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%_authenticated_access'
ORDER BY tablename;