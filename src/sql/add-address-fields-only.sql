-- Simple migration to just add address fields without enum changes
-- Run this first to get the basic functionality working

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

-- Add address fields to contacts table
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