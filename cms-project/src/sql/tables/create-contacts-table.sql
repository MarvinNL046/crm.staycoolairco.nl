-- ================================================================
-- CONTACTS TABLE CREATION
-- For Staycool CRM - Contact Management
-- ================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    
    -- Basic Information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    
    -- Company Association
    company_id UUID,
    company_name TEXT,
    job_title TEXT,
    department TEXT,
    
    -- Contact Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    relationship_status TEXT DEFAULT 'prospect' CHECK (relationship_status IN ('prospect', 'lead', 'customer', 'partner', 'vendor', 'other')),
    temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold')),
    
    -- Address Information
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Nederland',
    
    -- Communication Preferences
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp')),
    do_not_call BOOLEAN DEFAULT FALSE,
    do_not_email BOOLEAN DEFAULT FALSE,
    
    -- Social Media
    linkedin_url TEXT,
    twitter_handle TEXT,
    website TEXT,
    
    -- Lead Source & Conversion
    source TEXT,
    source_details TEXT,
    lead_id UUID, -- Original lead if converted from lead
    converted_from_lead_at TIMESTAMPTZ,
    
    -- Tags & Categories
    tags TEXT[],
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    
    -- Foreign Keys
    CONSTRAINT contacts_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT contacts_lead_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_status ON contacts(relationship_status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view contacts in their tenant" ON contacts
    FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create contacts in their tenant" ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update contacts in their tenant" ON contacts
    FOR UPDATE
    TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete contacts in their tenant" ON contacts
    FOR DELETE
    TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Contact management table for CRM system';
COMMENT ON COLUMN contacts.temperature IS 'Contact engagement level: hot (very interested), warm (somewhat interested), cold (low interest)';
COMMENT ON COLUMN contacts.relationship_status IS 'Current relationship with the contact';
COMMENT ON COLUMN contacts.lead_id IS 'Reference to original lead if this contact was converted from a lead';