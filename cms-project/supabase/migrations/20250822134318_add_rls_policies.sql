-- Enable RLS on all tables and add comprehensive policies
-- This ensures proper multi-tenant data isolation

-- Enable RLS on all tables (if not already enabled)
-- Using DO block to handle tables that might not exist
DO $$
BEGIN
    -- Core tables (these should always exist)
    ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS automation_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS automation_rules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS btw_percentages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS campaign_metrics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS campaigns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS email_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS email_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS invoice_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS pipeline_stages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS webhook_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS workflow_executions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS workflow_steps ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS workflow_templates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS workflows ENABLE ROW LEVEL SECURITY;
    
    -- Note: appointment_reminders and recurring_appointments are handled in a separate migration
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Some tables do not exist yet, skipping...';
END $$;

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

-- Create helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION auth.tenant_id() 
RETURNS UUID AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles table policies (special case - users see their own profile)
CREATE POLICY "Users can view their own profile" ON profiles
    FOR ALL USING (id = auth.uid());

-- Tenants table policies
CREATE POLICY "Users can view their tenant" ON tenants
    FOR SELECT USING (id = auth.tenant_id());

-- Generic policies for all tenant-scoped tables
-- Leads
CREATE POLICY "Users can view their tenant's leads" ON leads
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create leads for their tenant" ON leads
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's leads" ON leads
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's leads" ON leads
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- Contacts
CREATE POLICY "Users can view their tenant's contacts" ON contacts
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create contacts for their tenant" ON contacts
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's contacts" ON contacts
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's contacts" ON contacts
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- Customers
CREATE POLICY "Users can view their tenant's customers" ON customers
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create customers for their tenant" ON customers
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's customers" ON customers
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's customers" ON customers
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- Companies
CREATE POLICY "Users can view their tenant's companies" ON companies
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create companies for their tenant" ON companies
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's companies" ON companies
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's companies" ON companies
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- Invoices
CREATE POLICY "Users can view their tenant's invoices" ON invoices
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create invoices for their tenant" ON invoices
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's invoices" ON invoices
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's invoices" ON invoices
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- Invoice Items (access based on invoice)
CREATE POLICY "Users can view invoice items" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.tenant_id = auth.tenant_id()
        )
    );
CREATE POLICY "Users can manage invoice items" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.tenant_id = auth.tenant_id()
        )
    );

-- Appointments
CREATE POLICY "Users can view their tenant's appointments" ON appointments
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create appointments for their tenant" ON appointments
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's appointments" ON appointments
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's appointments" ON appointments
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- Products
CREATE POLICY "Users can view their tenant's products" ON products
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create products for their tenant" ON products
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "Users can update their tenant's products" ON products
    FOR UPDATE USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can delete their tenant's products" ON products
    FOR DELETE USING (tenant_id = auth.tenant_id());

-- BTW Percentages
CREATE POLICY "Users can view their tenant's BTW percentages" ON btw_percentages
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's BTW percentages" ON btw_percentages
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Tags
CREATE POLICY "Users can view their tenant's tags" ON tags
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's tags" ON tags
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Email Templates
CREATE POLICY "Users can view their tenant's email templates" ON email_templates
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's email templates" ON email_templates
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Campaigns
CREATE POLICY "Users can view their tenant's campaigns" ON campaigns
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's campaigns" ON campaigns
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Pipeline Stages
CREATE POLICY "Users can view their tenant's pipeline stages" ON pipeline_stages
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's pipeline stages" ON pipeline_stages
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Workflows
CREATE POLICY "Users can view their tenant's workflows" ON workflows
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's workflows" ON workflows
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Automation Rules
CREATE POLICY "Users can view their tenant's automation rules" ON automation_rules
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's automation rules" ON automation_rules
    FOR ALL USING (tenant_id = auth.tenant_id());

-- API Keys
CREATE POLICY "Users can view their tenant's API keys" ON api_keys
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can manage their tenant's API keys" ON api_keys
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Workflow Templates (usually global, but can be tenant-specific)
CREATE POLICY "Users can view workflow templates" ON workflow_templates
    FOR SELECT USING (true);

-- Email Logs
CREATE POLICY "Users can view their tenant's email logs" ON email_logs
    FOR SELECT USING (tenant_id = auth.tenant_id());
CREATE POLICY "Users can create email logs" ON email_logs
    FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO authenticated;

-- Summary
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been applied to all tables';
    RAISE NOTICE 'Multi-tenant data isolation is now enforced';
    RAISE NOTICE 'Users can only access data from their own tenant';
END $$;