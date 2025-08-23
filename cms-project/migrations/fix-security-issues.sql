-- Fix Security Issues for Supabase Database
-- This script addresses the security warnings from Supabase linter

-- ========================================
-- 1. Fix SECURITY DEFINER Views
-- ========================================
-- Remove SECURITY DEFINER from views (use SECURITY INVOKER instead)

-- Fix v_leads_by_status view
DROP VIEW IF EXISTS public.v_leads_by_status CASCADE;
CREATE OR REPLACE VIEW public.v_leads_by_status 
WITH (security_invoker = true) AS
SELECT 
    status,
    COUNT(*) as count
FROM public.leads
GROUP BY status;

-- Fix v_current_user_tenants view
DROP VIEW IF EXISTS public.v_current_user_tenants CASCADE;
CREATE OR REPLACE VIEW public.v_current_user_tenants 
WITH (security_invoker = true) AS
SELECT 
    t.*
FROM public.tenants t
JOIN public.tenant_users tu ON t.id = tu.tenant_id
WHERE tu.user_id = auth.uid();

-- Fix appointments_pending_reminders view
DROP VIEW IF EXISTS public.appointments_pending_reminders CASCADE;
CREATE OR REPLACE VIEW public.appointments_pending_reminders 
WITH (security_invoker = true) AS
SELECT 
    a.*
FROM public.appointments a
WHERE a.reminder_sent = false 
    AND a.start_time > NOW()
    AND a.reminder_time <= NOW();

-- ========================================
-- 2. Enable RLS on all public tables
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. Create RLS Policies
-- ========================================

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION auth.user_is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION auth.user_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's tenant
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Leads table policies (tenant-based access)
CREATE POLICY "Users can view leads in their tenant" ON public.leads
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id() 
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can create leads in their tenant" ON public.leads
    FOR INSERT WITH CHECK (
        tenant_id = auth.user_tenant_id()
    );

CREATE POLICY "Users can update leads in their tenant" ON public.leads
    FOR UPDATE USING (
        tenant_id = auth.user_tenant_id()
    );

CREATE POLICY "Users can delete leads in their tenant" ON public.leads
    FOR DELETE USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

-- Appointments table policies
CREATE POLICY "Users can view appointments in their tenant" ON public.appointments
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can create appointments in their tenant" ON public.appointments
    FOR INSERT WITH CHECK (
        tenant_id = auth.user_tenant_id()
    );

CREATE POLICY "Users can update appointments in their tenant" ON public.appointments
    FOR UPDATE USING (
        tenant_id = auth.user_tenant_id()
    );

CREATE POLICY "Users can delete appointments in their tenant" ON public.appointments
    FOR DELETE USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

-- Workflows table policies
CREATE POLICY "Users can view workflows in their tenant" ON public.workflows
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can create workflows in their tenant" ON public.workflows
    FOR INSERT WITH CHECK (
        tenant_id = auth.user_tenant_id()
    );

CREATE POLICY "Users can update workflows in their tenant" ON public.workflows
    FOR UPDATE USING (
        tenant_id = auth.user_tenant_id()
    );

CREATE POLICY "Users can delete workflows in their tenant" ON public.workflows
    FOR DELETE USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

-- Workflow executions policies
CREATE POLICY "Users can view workflow executions in their tenant" ON public.workflow_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_id
            AND w.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

-- Workflow actions policies
CREATE POLICY "Users can view workflow actions in their tenant" ON public.workflow_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_id
            AND w.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

-- Workflow triggers policies
CREATE POLICY "Users can view workflow triggers in their tenant" ON public.workflow_triggers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            WHERE w.id = workflow_id
            AND w.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

-- Campaign tables policies
CREATE POLICY "Users can view campaign recipients in their tenant" ON public.campaign_recipients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can view campaign links in their tenant" ON public.campaign_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_id
            AND c.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can view campaign clicks in their tenant" ON public.campaign_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaign_links cl
            JOIN public.campaigns c ON c.id = cl.campaign_id
            WHERE cl.id = link_id
            AND c.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

-- Tenant users policies
CREATE POLICY "Users can view tenant users in their tenant" ON public.tenant_users
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Super admins can manage tenant users" ON public.tenant_users
    FOR ALL USING (auth.user_is_super_admin());

-- Pipeline stages policies
CREATE POLICY "Users can view pipeline stages in their tenant" ON public.pipeline_stages
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can manage pipeline stages in their tenant" ON public.pipeline_stages
    FOR ALL USING (
        tenant_id = auth.user_tenant_id()
        AND auth.user_is_authenticated()
    );

-- Automation rules policies
CREATE POLICY "Users can view automation rules in their tenant" ON public.automation_rules
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

CREATE POLICY "Users can manage automation rules in their tenant" ON public.automation_rules
    FOR ALL USING (
        tenant_id = auth.user_tenant_id()
        AND auth.user_is_authenticated()
    );

-- Automation executions policies
CREATE POLICY "Users can view automation executions in their tenant" ON public.automation_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.automation_rules ar
            WHERE ar.id = rule_id
            AND ar.tenant_id = auth.user_tenant_id()
        )
        OR auth.user_is_super_admin()
    );

-- System audit log policies (read-only for users)
CREATE POLICY "Users can view audit logs for their tenant" ON public.system_audit_log
    FOR SELECT USING (
        tenant_id = auth.user_tenant_id()
        OR auth.user_is_super_admin()
    );

-- Super admins table policies
CREATE POLICY "Only super admins can view super admins" ON public.super_admins
    FOR SELECT USING (auth.user_is_super_admin());

CREATE POLICY "Only super admins can manage super admins" ON public.super_admins
    FOR ALL USING (auth.user_is_super_admin());

-- Message outbox policies
CREATE POLICY "Service role can manage message outbox" ON public.message_outbox
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Platform settings policies
CREATE POLICY "Only super admins can view platform settings" ON public.platform_settings
    FOR SELECT USING (auth.user_is_super_admin());

CREATE POLICY "Only super admins can manage platform settings" ON public.platform_settings
    FOR ALL USING (auth.user_is_super_admin());

-- Workflow templates policies (public read, admin write)
CREATE POLICY "Anyone can view workflow templates" ON public.workflow_templates
    FOR SELECT USING (true);

CREATE POLICY "Only super admins can manage workflow templates" ON public.workflow_templates
    FOR INSERT USING (auth.user_is_super_admin());

CREATE POLICY "Only super admins can update workflow templates" ON public.workflow_templates
    FOR UPDATE USING (auth.user_is_super_admin());

CREATE POLICY "Only super admins can delete workflow templates" ON public.workflow_templates
    FOR DELETE USING (auth.user_is_super_admin());

-- ========================================
-- 4. Grant necessary permissions
-- ========================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on views to authenticated users
GRANT SELECT ON public.v_leads_by_status TO authenticated;
GRANT SELECT ON public.v_current_user_tenants TO authenticated;
GRANT SELECT ON public.appointments_pending_reminders TO authenticated;

-- ========================================
-- 5. Add indexes for performance
-- ========================================

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);

-- ========================================
-- Verification queries
-- ========================================
-- Run these to verify the fixes:
-- SELECT * FROM pg_views WHERE viewname IN ('v_leads_by_status', 'v_current_user_tenants', 'appointments_pending_reminders');
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;