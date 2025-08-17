-- Simplified migration for creating the customers table
-- Run this if the full migration fails

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
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_lead ON customers(lead_id);
CREATE INDEX IF NOT EXISTS idx_customers_contact ON customers(contact_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Create view for unified customer search
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