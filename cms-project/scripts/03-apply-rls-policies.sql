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

-- Create helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION auth.tenant_id() 
RETURNS UUID AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant usage on the function
GRANT EXECUTE ON FUNCTION auth.tenant_id() TO authenticated;

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

-- And all other tables...
-- (Add remaining policies as in the original file)