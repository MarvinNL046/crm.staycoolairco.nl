-- Fix RLS Performance Issues
-- This migration optimizes RLS policies by using subqueries for auth functions
-- and consolidates multiple permissive policies

-- First, drop all existing policies that need to be optimized
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop policies for tables with auth performance issues
    FOR r IN 
        SELECT DISTINCT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename IN (
            'tenants', 'user_tenants', 'customers', 'contacts', 'deals', 
            'campaigns', 'tasks', 'call_logs', 'templates', 'team_members',
            'integrations', 'api_keys', 'analytics_events', 'automation_triggers',
            'invoices', 'invoice_items', 'products', 'invoice_sequences',
            'email_logs', 'sms_logs'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Helper function to get current user's tenant_id efficiently
CREATE OR REPLACE FUNCTION public.get_user_tenant_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() 
    LIMIT 1
$$;

-- Create optimized policies for each table

-- TENANTS table
CREATE POLICY "tenant_select" ON public.tenants FOR SELECT
    USING (id IN (SELECT tenant_id FROM public.user_tenants WHERE user_id = (SELECT auth.uid())));

-- USER_TENANTS table
CREATE POLICY "user_tenant_select" ON public.user_tenants FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- CUSTOMERS table
CREATE POLICY "customer_select" ON public.customers FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "customer_insert" ON public.customers FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "customer_update" ON public.customers FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "customer_delete" ON public.customers FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- CONTACTS table
CREATE POLICY "contact_select" ON public.contacts FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "contact_insert" ON public.contacts FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "contact_update" ON public.contacts FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "contact_delete" ON public.contacts FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- DEALS table
CREATE POLICY "deal_select" ON public.deals FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "deal_insert" ON public.deals FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "deal_update" ON public.deals FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "deal_delete" ON public.deals FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- CAMPAIGNS table
CREATE POLICY "campaign_select" ON public.campaigns FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "campaign_insert" ON public.campaigns FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "campaign_update" ON public.campaigns FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "campaign_delete" ON public.campaigns FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- TASKS table
CREATE POLICY "task_select" ON public.tasks FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "task_insert" ON public.tasks FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "task_update" ON public.tasks FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "task_delete" ON public.tasks FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- CALL_LOGS table
CREATE POLICY "call_log_select" ON public.call_logs FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "call_log_insert" ON public.call_logs FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "call_log_update" ON public.call_logs FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "call_log_delete" ON public.call_logs FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- TEMPLATES table
CREATE POLICY "template_select" ON public.templates FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "template_insert" ON public.templates FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "template_update" ON public.templates FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "template_delete" ON public.templates FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- TEAM_MEMBERS table
CREATE POLICY "team_member_select" ON public.team_members FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "team_member_insert" ON public.team_members FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "team_member_update" ON public.team_members FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "team_member_delete" ON public.team_members FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- INTEGRATIONS table
CREATE POLICY "integration_select" ON public.integrations FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "integration_insert" ON public.integrations FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "integration_update" ON public.integrations FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "integration_delete" ON public.integrations FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- API_KEYS table
CREATE POLICY "api_key_select" ON public.api_keys FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "api_key_insert" ON public.api_keys FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "api_key_update" ON public.api_keys FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "api_key_delete" ON public.api_keys FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- ANALYTICS_EVENTS table
CREATE POLICY "analytics_event_select" ON public.analytics_events FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "analytics_event_insert" ON public.analytics_events FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "analytics_event_update" ON public.analytics_events FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "analytics_event_delete" ON public.analytics_events FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- AUTOMATION_TRIGGERS table
CREATE POLICY "automation_trigger_select" ON public.automation_triggers FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "automation_trigger_insert" ON public.automation_triggers FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "automation_trigger_update" ON public.automation_triggers FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "automation_trigger_delete" ON public.automation_triggers FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- INVOICES table
CREATE POLICY "invoice_select" ON public.invoices FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "invoice_insert" ON public.invoices FOR INSERT
    WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "invoice_update" ON public.invoices FOR UPDATE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

CREATE POLICY "invoice_delete" ON public.invoices FOR DELETE
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- INVOICE_ITEMS table (consolidated policy)
CREATE POLICY "invoice_item_all" ON public.invoice_items FOR ALL
    USING (
        invoice_id IN (
            SELECT id FROM public.invoices 
            WHERE tenant_id = (SELECT public.get_user_tenant_id())
        )
    );

-- PRODUCTS table (consolidated policy)
CREATE POLICY "product_all" ON public.products FOR ALL
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- INVOICE_SEQUENCES table
CREATE POLICY "invoice_sequence_all" ON public.invoice_sequences FOR ALL
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- EMAIL_LOGS table
CREATE POLICY "email_log_select" ON public.email_logs FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- SMS_LOGS table
CREATE POLICY "sms_log_select" ON public.sms_logs FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));

-- Add index to improve performance of tenant lookups
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);

-- Add comment explaining the optimization
COMMENT ON FUNCTION public.get_user_tenant_id() IS 'Efficiently retrieves the current user tenant_id for use in RLS policies. This avoids re-evaluating auth.uid() for each row.';