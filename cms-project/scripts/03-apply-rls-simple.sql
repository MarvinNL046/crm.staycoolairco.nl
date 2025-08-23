-- Simple RLS setup that works with current structure
-- This version doesn't rely on profiles.tenant_id

-- Enable RLS on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE btw_percentages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;

-- For now, create simple policies that allow authenticated users to see all data
-- This is temporary until profiles table is fixed

-- Drop existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create temporary permissive policies for authenticated users
-- Replace these with proper tenant-based policies after fixing profiles table

-- Profiles
CREATE POLICY "Authenticated users can view profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Tenants
CREATE POLICY "Authenticated users can view tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

-- For all other tables with tenant_id, create simple policies
-- These will be replaced with proper tenant isolation later

-- Leads
CREATE POLICY "Authenticated users can manage leads" ON leads
    FOR ALL USING (auth.role() = 'authenticated');

-- Contacts
CREATE POLICY "Authenticated users can manage contacts" ON contacts
    FOR ALL USING (auth.role() = 'authenticated');

-- Customers
CREATE POLICY "Authenticated users can manage customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

-- Companies
CREATE POLICY "Authenticated users can manage companies" ON companies
    FOR ALL USING (auth.role() = 'authenticated');

-- Invoices
CREATE POLICY "Authenticated users can manage invoices" ON invoices
    FOR ALL USING (auth.role() = 'authenticated');

-- Invoice Items
CREATE POLICY "Authenticated users can manage invoice items" ON invoice_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Appointments
CREATE POLICY "Authenticated users can manage appointments" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Products
CREATE POLICY "Authenticated users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- BTW Percentages
CREATE POLICY "Authenticated users can manage BTW percentages" ON btw_percentages
    FOR ALL USING (auth.role() = 'authenticated');

-- Tags
CREATE POLICY "Authenticated users can manage tags" ON tags
    FOR ALL USING (auth.role() = 'authenticated');

-- Email Templates
CREATE POLICY "Authenticated users can manage email templates" ON email_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Campaigns
CREATE POLICY "Authenticated users can manage campaigns" ON campaigns
    FOR ALL USING (auth.role() = 'authenticated');

-- Campaign Metrics
CREATE POLICY "Authenticated users can manage campaign metrics" ON campaign_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Pipeline Stages
CREATE POLICY "Authenticated users can manage pipeline stages" ON pipeline_stages
    FOR ALL USING (auth.role() = 'authenticated');

-- Workflows
CREATE POLICY "Authenticated users can manage workflows" ON workflows
    FOR ALL USING (auth.role() = 'authenticated');

-- Workflow Templates
CREATE POLICY "Authenticated users can view workflow templates" ON workflow_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Workflow Steps
CREATE POLICY "Authenticated users can manage workflow steps" ON workflow_steps
    FOR ALL USING (auth.role() = 'authenticated');

-- Workflow Executions
CREATE POLICY "Authenticated users can manage workflow executions" ON workflow_executions
    FOR ALL USING (auth.role() = 'authenticated');

-- Automation Rules
CREATE POLICY "Authenticated users can manage automation rules" ON automation_rules
    FOR ALL USING (auth.role() = 'authenticated');

-- Automation Logs
CREATE POLICY "Authenticated users can manage automation logs" ON automation_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- API Keys
CREATE POLICY "Authenticated users can manage API keys" ON api_keys
    FOR ALL USING (auth.role() = 'authenticated');

-- Webhook Logs
CREATE POLICY "Authenticated users can manage webhook logs" ON webhook_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Email Logs
CREATE POLICY "Authenticated users can manage email logs" ON email_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Appointment Reminders
CREATE POLICY "Authenticated users can manage appointment reminders" ON appointment_reminders
    FOR ALL USING (auth.role() = 'authenticated');

-- Recurring Appointments
CREATE POLICY "Authenticated users can manage recurring appointments" ON recurring_appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Note: These policies allow any authenticated user to access all data
-- This is NOT suitable for multi-tenant production use
-- Run 00-fix-profiles-complete.sql first, then use 03-apply-rls-policies-fixed.sql for proper tenant isolation