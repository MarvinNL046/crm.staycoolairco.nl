-- Fix Remaining Security Issues for Supabase Database
-- This script addresses function search_path warnings and improves RLS policies

-- ========================================
-- 1. Fix Function Search Path Issues
-- ========================================
-- Set search_path for all functions to prevent security issues

-- Fix generate_recurring_appointments
ALTER FUNCTION public.generate_recurring_appointments() 
SET search_path = public, pg_catalog;

-- Fix set_updated_at
ALTER FUNCTION public.set_updated_at() 
SET search_path = public, pg_catalog;

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = public, pg_catalog;

-- Fix create_super_admin_user
ALTER FUNCTION public.create_super_admin_user() 
SET search_path = public, pg_catalog;

-- Fix create_tenant_for_user
ALTER FUNCTION public.create_tenant_for_user(uuid) 
SET search_path = public, pg_catalog;

-- Fix update_automation_rules_updated_at
ALTER FUNCTION public.update_automation_rules_updated_at() 
SET search_path = public, pg_catalog;

-- Fix create_default_automation_rules
ALTER FUNCTION public.create_default_automation_rules(uuid) 
SET search_path = public, pg_catalog;

-- Fix create_tenant_rls_policies
ALTER FUNCTION public.create_tenant_rls_policies(text) 
SET search_path = public, pg_catalog;

-- Fix calculate_invoice_totals
ALTER FUNCTION public.calculate_invoice_totals() 
SET search_path = public, pg_catalog;

-- Fix update_invoice_totals
ALTER FUNCTION public.update_invoice_totals() 
SET search_path = public, pg_catalog;

-- Fix generate_invoice_number
ALTER FUNCTION public.generate_invoice_number(uuid, text) 
SET search_path = public, pg_catalog;

-- ========================================
-- 2. Move Extensions to Separate Schema
-- ========================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, authenticated, service_role;

-- Move pg_trgm extension
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;

-- Move unaccent extension
DROP EXTENSION IF EXISTS unaccent CASCADE;
CREATE EXTENSION unaccent WITH SCHEMA extensions;

-- Update search_path for database to include extensions
ALTER DATABASE postgres SET search_path TO public, extensions;

-- ========================================
-- 3. Improve RLS Policies
-- ========================================

-- Helper function to get user's tenant (if not exists)
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() LIMIT 1),
        (SELECT tenant_id FROM public.user_tenants WHERE user_id = auth.uid() LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Replace basic authenticated policies with proper tenant-based ones

-- Appointments
DROP POLICY IF EXISTS "appointments_authenticated_access" ON public.appointments;
CREATE POLICY "Users can view appointments in their tenant" ON public.appointments
    FOR SELECT USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can create appointments in their tenant" ON public.appointments
    FOR INSERT WITH CHECK (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can update appointments in their tenant" ON public.appointments
    FOR UPDATE USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can delete appointments in their tenant" ON public.appointments
    FOR DELETE USING (tenant_id = auth.user_tenant_id());

-- Automation Rules
DROP POLICY IF EXISTS "automation_rules_authenticated_access" ON public.automation_rules;
CREATE POLICY "Users can view automation rules in their tenant" ON public.automation_rules
    FOR SELECT USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can manage automation rules in their tenant" ON public.automation_rules
    FOR ALL USING (tenant_id = auth.user_tenant_id());

-- Automation Executions
DROP POLICY IF EXISTS "automation_executions_authenticated_access" ON public.automation_executions;
CREATE POLICY "Users can view automation executions in their tenant" ON public.automation_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.automation_rules ar
            WHERE ar.id = rule_id AND ar.tenant_id = auth.user_tenant_id()
        )
    );

-- Leads
DROP POLICY IF EXISTS "leads_authenticated_access" ON public.leads;
CREATE POLICY "Users can view leads in their tenant" ON public.leads
    FOR SELECT USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can create leads in their tenant" ON public.leads
    FOR INSERT WITH CHECK (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can update leads in their tenant" ON public.leads
    FOR UPDATE USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can delete leads in their tenant" ON public.leads
    FOR DELETE USING (tenant_id = auth.user_tenant_id());

-- Workflows
DROP POLICY IF EXISTS "workflows_authenticated_access" ON public.workflows;
CREATE POLICY "Users can view workflows in their tenant" ON public.workflows
    FOR SELECT USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can manage workflows in their tenant" ON public.workflows
    FOR ALL USING (tenant_id = auth.user_tenant_id());

-- Workflow Actions
DROP POLICY IF EXISTS "workflow_actions_authenticated_access" ON public.workflow_actions;
CREATE POLICY "Users can view workflow actions in their tenant" ON public.workflow_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_id AND w.tenant_id = auth.user_tenant_id()
        )
    );

-- Workflow Executions
DROP POLICY IF EXISTS "workflow_executions_authenticated_access" ON public.workflow_executions;
CREATE POLICY "Users can view workflow executions in their tenant" ON public.workflow_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_id AND w.tenant_id = auth.user_tenant_id()
        )
    );

-- Workflow Triggers
DROP POLICY IF EXISTS "workflow_triggers_authenticated_access" ON public.workflow_triggers;
CREATE POLICY "Users can view workflow triggers in their tenant" ON public.workflow_triggers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_id AND w.tenant_id = auth.user_tenant_id()
        )
    );

-- Campaign Recipients
DROP POLICY IF EXISTS "campaign_recipients_authenticated_access" ON public.campaign_recipients;
CREATE POLICY "Users can view campaign recipients in their tenant" ON public.campaign_recipients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id AND c.tenant_id = auth.user_tenant_id()
        )
    );

-- Campaign Links
DROP POLICY IF EXISTS "campaign_links_authenticated_access" ON public.campaign_links;
CREATE POLICY "Users can view campaign links in their tenant" ON public.campaign_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id AND c.tenant_id = auth.user_tenant_id()
        )
    );

-- Campaign Clicks
DROP POLICY IF EXISTS "campaign_clicks_authenticated_access" ON public.campaign_clicks;
CREATE POLICY "Users can view campaign clicks in their tenant" ON public.campaign_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaign_links cl
            JOIN public.campaigns c ON c.id = cl.campaign_id
            WHERE cl.id = link_id AND c.tenant_id = auth.user_tenant_id()
        )
    );

-- Pipeline Stages
DROP POLICY IF EXISTS "pipeline_stages_authenticated_access" ON public.pipeline_stages;
CREATE POLICY "Users can view pipeline stages in their tenant" ON public.pipeline_stages
    FOR SELECT USING (tenant_id = auth.user_tenant_id());
CREATE POLICY "Users can manage pipeline stages in their tenant" ON public.pipeline_stages
    FOR ALL USING (tenant_id = auth.user_tenant_id());

-- Profiles
DROP POLICY IF EXISTS "profiles_authenticated_access" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Tenant Users
DROP POLICY IF EXISTS "tenant_users_authenticated_access" ON public.tenant_users;
CREATE POLICY "Users can view tenant users in their tenant" ON public.tenant_users
    FOR SELECT USING (tenant_id = auth.user_tenant_id());

-- System Audit Log (read-only for users)
DROP POLICY IF EXISTS "system_audit_log_authenticated_access" ON public.system_audit_log;
CREATE POLICY "Users can view audit logs for their tenant" ON public.system_audit_log
    FOR SELECT USING (tenant_id = auth.user_tenant_id());

-- Super Admins (restricted access)
DROP POLICY IF EXISTS "super_admins_authenticated_access" ON public.super_admins;
CREATE POLICY "Only super admins can access super_admins table" ON public.super_admins
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
    );

-- Platform Settings (super admin only)
DROP POLICY IF EXISTS "platform_settings_authenticated_access" ON public.platform_settings;
CREATE POLICY "Only super admins can access platform settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
    );

-- Message Outbox (service role only)
DROP POLICY IF EXISTS "message_outbox_authenticated_access" ON public.message_outbox;
CREATE POLICY "Only service role can access message outbox" ON public.message_outbox
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Workflow Templates (public read, admin write)
DROP POLICY IF EXISTS "workflow_templates_authenticated_access" ON public.workflow_templates;
CREATE POLICY "Anyone can view workflow templates" ON public.workflow_templates
    FOR SELECT USING (true);
CREATE POLICY "Only super admins can manage workflow templates" ON public.workflow_templates
    FOR INSERT USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Only super admins can update workflow templates" ON public.workflow_templates
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));
CREATE POLICY "Only super admins can delete workflow templates" ON public.workflow_templates
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()));

-- ========================================
-- 4. Create indexes for performance
-- ========================================

-- Add indexes for common tenant queries
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON public.automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON public.campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant_id ON public.pipeline_stages(tenant_id);

-- Add indexes for user lookups
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- ========================================
-- 5. Verification Queries
-- ========================================

-- Check functions have search_path set
SELECT 
    proname as function_name,
    proconfig
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname IN (
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

-- Check extensions are in correct schema
SELECT 
    extname as extension_name,
    nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('pg_trgm', 'unaccent');

-- Check RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;