-- Add missing columns to contacts table
-- This migration adds all the columns that are expected by the application

-- Add mobile phone
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Add job title and department
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS department TEXT;

-- Add status columns
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'prospect' CHECK (relationship_status IN ('prospect', 'lead', 'customer', 'partner', 'vendor', 'other'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold'));

-- Add address fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nederland';

-- Add communication preferences
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS do_not_call BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS do_not_email BOOLEAN DEFAULT FALSE;

-- Add social media
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT;

-- Add lead source and conversion
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source_details TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS converted_from_lead_at TIMESTAMPTZ;

-- Add tags
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add notes
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add metadata
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Rename company to company_name for consistency
ALTER TABLE contacts RENAME COLUMN company TO company_name;

-- Add company_id for future company relationships
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add foreign key constraint for lead_id if leads table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        ALTER TABLE contacts ADD CONSTRAINT contacts_lead_fkey 
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_mobile ON contacts(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company_name ON contacts(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_relationship_status ON contacts(relationship_status);
CREATE INDEX IF NOT EXISTS idx_contacts_temperature ON contacts(temperature) WHERE temperature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts(city) WHERE city IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN contacts.temperature IS 'Contact engagement level: hot (very interested), warm (somewhat interested), cold (low interest)';
COMMENT ON COLUMN contacts.relationship_status IS 'Current relationship with the contact';
COMMENT ON COLUMN contacts.lead_id IS 'Reference to original lead if this contact was converted from a lead';
COMMENT ON COLUMN contacts.company_name IS 'Company name as text (for contacts without formal company records)';
COMMENT ON COLUMN contacts.company_id IS 'Foreign key to companies table (when formal company record exists)';