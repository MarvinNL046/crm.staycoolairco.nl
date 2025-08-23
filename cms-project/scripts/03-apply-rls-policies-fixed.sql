-- Enable RLS on all tables (fixed version - no auth schema access needed)
-- This version creates the helper function in public schema

-- Create helper function to get user's tenant_id in public schema
CREATE OR REPLACE FUNCTION public.get_user_tenant_id() 
RETURNS UUID AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;

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

-- Drop existing policies to avoid conflicts
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

-- Profiles table policies (special case - users see their own profile)
CREATE POLICY "Users can view their own profile" ON profiles
    FOR ALL USING (id = auth.uid());

-- Tenants table policies
CREATE POLICY "Users can view their tenant" ON tenants
    FOR SELECT USING (id = public.get_user_tenant_id());

-- Generic policies for all tenant-scoped tables
-- Leads
CREATE POLICY "Users can view their tenant's leads" ON leads
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create leads for their tenant" ON leads
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's leads" ON leads
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's leads" ON leads
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- Contacts
CREATE POLICY "Users can view their tenant's contacts" ON contacts
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create contacts for their tenant" ON contacts
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's contacts" ON contacts
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's contacts" ON contacts
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- Customers
CREATE POLICY "Users can view their tenant's customers" ON customers
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create customers for their tenant" ON customers
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's customers" ON customers
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's customers" ON customers
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- Companies
CREATE POLICY "Users can view their tenant's companies" ON companies
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create companies for their tenant" ON companies
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's companies" ON companies
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's companies" ON companies
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- Invoices
CREATE POLICY "Users can view their tenant's invoices" ON invoices
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create invoices for their tenant" ON invoices
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's invoices" ON invoices
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's invoices" ON invoices
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- Invoice Items (access based on invoice)
CREATE POLICY "Users can view invoice items" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.tenant_id = public.get_user_tenant_id()
        )
    );
CREATE POLICY "Users can manage invoice items" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.tenant_id = public.get_user_tenant_id()
        )
    );

-- Appointments
CREATE POLICY "Users can view their tenant's appointments" ON appointments
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create appointments for their tenant" ON appointments
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's appointments" ON appointments
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's appointments" ON appointments
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- Products
CREATE POLICY "Users can view their tenant's products" ON products
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create products for their tenant" ON products
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their tenant's products" ON products
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete their tenant's products" ON products
    FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- BTW Percentages
CREATE POLICY "Users can view their tenant's BTW percentages" ON btw_percentages
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's BTW percentages" ON btw_percentages
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Tags
CREATE POLICY "Users can view their tenant's tags" ON tags
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's tags" ON tags
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Email Templates
CREATE POLICY "Users can view their tenant's email templates" ON email_templates
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's email templates" ON email_templates
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Campaigns
CREATE POLICY "Users can view their tenant's campaigns" ON campaigns
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's campaigns" ON campaigns
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Pipeline Stages
CREATE POLICY "Users can view their tenant's pipeline stages" ON pipeline_stages
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's pipeline stages" ON pipeline_stages
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Workflows
CREATE POLICY "Users can view their tenant's workflows" ON workflows
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's workflows" ON workflows
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Automation Rules
CREATE POLICY "Users can view their tenant's automation rules" ON automation_rules
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's automation rules" ON automation_rules
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- API Keys
CREATE POLICY "Users can view their tenant's API keys" ON api_keys
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's API keys" ON api_keys
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- Webhook Logs
CREATE POLICY "Users can view their tenant's webhook logs" ON webhook_logs
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create webhook logs" ON webhook_logs
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Email Logs
CREATE POLICY "Users can view their tenant's email logs" ON email_logs
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create email logs" ON email_logs
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Workflow Templates (usually global, but can be tenant-specific)
CREATE POLICY "Users can view workflow templates" ON workflow_templates
    FOR SELECT USING (true);

-- Campaign Metrics (based on campaign)
CREATE POLICY "Users can view campaign metrics" ON campaign_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_metrics.campaign_id 
            AND campaigns.tenant_id = public.get_user_tenant_id()
        )
    );

-- Workflow Steps (based on workflow)
CREATE POLICY "Users can view workflow steps" ON workflow_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = workflow_steps.workflow_id 
            AND workflows.tenant_id = public.get_user_tenant_id()
        )
    );

-- Workflow Executions (based on workflow)
CREATE POLICY "Users can view workflow executions" ON workflow_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = workflow_executions.workflow_id 
            AND workflows.tenant_id = public.get_user_tenant_id()
        )
    );

-- Automation Logs (based on rule)
CREATE POLICY "Users can view automation logs" ON automation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM automation_rules 
            WHERE automation_rules.id = automation_logs.rule_id 
            AND automation_rules.tenant_id = public.get_user_tenant_id()
        )
    );

-- Appointment Reminders (based on appointment)
CREATE POLICY "Users can view appointment reminders" ON appointment_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_reminders.appointment_id 
            AND appointments.tenant_id = public.get_user_tenant_id()
        )
    );

-- Recurring Appointments
CREATE POLICY "Users can view their tenant's recurring appointments" ON recurring_appointments
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can manage their tenant's recurring appointments" ON recurring_appointments
    FOR ALL USING (tenant_id = public.get_user_tenant_id());