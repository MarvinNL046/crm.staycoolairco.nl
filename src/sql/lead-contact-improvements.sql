-- Lead-to-Contact Workflow Improvements
-- This migration adds necessary fields for better lead-to-contact conversion

-- Add address fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS house_number VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Nederland';

-- Add conversion tracking fields to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_contact_id UUID REFERENCES contacts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add status for converted leads
-- First check if 'converted' is already in the constraint
DO $$ 
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
  
  -- Add new constraint with 'converted' included
  ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'converted'));
EXCEPTION
  WHEN others THEN
    -- If there's an error, it might be because it's an enum type
    -- In that case, we need to handle it differently
    RAISE NOTICE 'Could not update status constraint. You may need to update the enum type manually.';
END $$;

-- Add address fields to contacts table if they don't exist
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS street VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS house_number VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Nederland';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS position VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Add conversion tracking to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES leads(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Create unified customer view
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  -- References to source records
  lead_id UUID REFERENCES leads(id),
  contact_id UUID REFERENCES contacts(id),
  
  -- Primary type indicator
  primary_type VARCHAR(20) CHECK (primary_type IN ('lead', 'contact')),
  
  -- Unified customer data (denormalized for performance)
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  
  -- Address
  street VARCHAR(255),
  house_number VARCHAR(50),
  postal_code VARCHAR(20),
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Nederland',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_lead_per_customer UNIQUE (lead_id),
  CONSTRAINT unique_contact_per_customer UNIQUE (contact_id),
  CHECK (lead_id IS NOT NULL OR contact_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_contact ON leads(converted_to_contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_contacts_converted_from_lead ON contacts(converted_from_lead_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_lead ON customers(lead_id);
CREATE INDEX IF NOT EXISTS idx_customers_contact ON customers(contact_id);

-- Function to sync customer data
CREATE OR REPLACE FUNCTION sync_customer_data()
RETURNS TRIGGER AS $$
BEGIN
  -- When a lead is updated
  IF TG_TABLE_NAME = 'leads' THEN
    UPDATE customers
    SET 
      name = NEW.name,
      email = NEW.email,
      phone = NEW.phone,
      company = NEW.company,
      street = NEW.street,
      house_number = NEW.house_number,
      postal_code = NEW.postal_code,
      city = NEW.city,
      province = NEW.province,
      country = NEW.country,
      updated_at = NOW()
    WHERE lead_id = NEW.id;
  
  -- When a contact is updated
  ELSIF TG_TABLE_NAME = 'contacts' THEN
    UPDATE customers
    SET 
      name = NEW.name,
      email = NEW.email,
      phone = NEW.phone,
      company = NEW.company,
      street = NEW.street,
      house_number = NEW.house_number,
      postal_code = NEW.postal_code,
      city = NEW.city,
      province = NEW.province,
      country = NEW.country,
      updated_at = NOW()
    WHERE contact_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic customer sync
CREATE TRIGGER sync_lead_to_customer
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_data();

CREATE TRIGGER sync_contact_to_customer
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_data();

-- Function to create customer record when lead/contact is created
CREATE OR REPLACE FUNCTION create_customer_record()
RETURNS TRIGGER AS $$
BEGIN
  -- For leads
  IF TG_TABLE_NAME = 'leads' THEN
    INSERT INTO customers (
      tenant_id, created_by, lead_id, primary_type,
      name, email, phone, company,
      street, house_number, postal_code, city, province, country
    ) VALUES (
      NEW.tenant_id, NEW.created_by, NEW.id, 'lead',
      NEW.name, NEW.email, NEW.phone, NEW.company,
      NEW.street, NEW.house_number, NEW.postal_code, NEW.city, NEW.province, NEW.country
    );
  
  -- For contacts
  ELSIF TG_TABLE_NAME = 'contacts' THEN
    INSERT INTO customers (
      tenant_id, created_by, contact_id, primary_type,
      name, email, phone, company,
      street, house_number, postal_code, city, province, country
    ) VALUES (
      NEW.tenant_id, NEW.created_by, NEW.id, 'contact',
      NEW.name, NEW.email, NEW.phone, NEW.company,
      NEW.street, NEW.house_number, NEW.postal_code, NEW.city, NEW.province, NEW.country
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic customer creation
CREATE TRIGGER create_customer_on_lead_insert
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_record();

CREATE TRIGGER create_customer_on_contact_insert
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_record();

-- RLS Policies for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers in their tenant" ON customers
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create customers in their tenant" ON customers
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers in their tenant" ON customers
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- View for unified customer search
CREATE OR REPLACE VIEW customer_search_view AS
SELECT 
  c.id,
  c.tenant_id,
  c.primary_type,
  c.name,
  c.email,
  c.phone,
  c.company,
  c.street,
  c.house_number,
  c.postal_code,
  c.city,
  c.province,
  c.country,
  c.lead_id,
  c.contact_id,
  CASE 
    WHEN c.lead_id IS NOT NULL THEN l.status
    WHEN c.contact_id IS NOT NULL THEN ct.status
  END as status,
  CASE 
    WHEN c.lead_id IS NOT NULL THEN l.tags
    WHEN c.contact_id IS NOT NULL THEN ct.tags
  END as tags,
  c.created_at,
  c.updated_at
FROM customers c
LEFT JOIN leads l ON c.lead_id = l.id
LEFT JOIN contacts ct ON c.contact_id = ct.id;

-- Grant permissions on the view
GRANT SELECT ON customer_search_view TO authenticated;