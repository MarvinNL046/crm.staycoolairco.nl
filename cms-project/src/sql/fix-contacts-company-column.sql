-- Fix contacts table company column issue
-- The error suggests the column is named 'company' instead of 'company_id'

-- First, let's check if company_id exists or if it's just 'company'
-- If 'company' exists and 'company_id' doesn't, we'll adjust our approach

-- Option 1: If the column is named 'company' and contains text (company name)
-- We'll keep using company_name and not create an index on a text field

-- Option 2: If we need to add company_id for future relationships
-- ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_id UUID;

-- For now, let's comment out the problematic index since we're storing company name as text
-- The index was: CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id) WHERE company_id IS NOT NULL;

-- Instead, create an index on company_name if it exists
CREATE INDEX IF NOT EXISTS idx_contacts_company_name ON contacts(company_name) WHERE company_name IS NOT NULL;

-- Also ensure the company column is properly named in our queries
-- The API and types expect 'company_name' not 'company'