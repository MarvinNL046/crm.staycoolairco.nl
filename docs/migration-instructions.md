# Migration Instructions for Lead-to-Invoice Workflow

## Quick Start

Run this SQL in your Supabase SQL Editor to add the necessary fields:

```sql
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
```

## What This Migration Does

1. **Adds address fields** to both leads and contacts tables
2. **Adds conversion tracking** to link converted leads to their resulting contacts
3. **Adds archiving support** for leads that have been converted

## Status Handling

The system uses the existing 'won' status for converted leads because:
- A converted lead is effectively a "won" lead
- No need to modify the existing enum
- Maintains compatibility with existing code

## Testing the System

After running the migration:

1. Go to `/invoicing/new` to create a new invoice
2. Search for a lead in the customer selector
3. Select the lead - you'll see the conversion prompt
4. Fill in any missing address information
5. The lead will be converted to a contact with status 'won'
6. The invoice will use the new contact data

## Already Applied

The following are already in place:
- ✅ Customers table (unified view)
- ✅ Customer search view
- ✅ Lead-to-contact conversion API
- ✅ Smart customer selector component
- ✅ Updated invoice creation flow

## Notes

- The `converted_to_contact_id` field tracks which contact a lead was converted to
- The `converted_from_lead_id` field tracks which lead a contact came from
- The `archived` flag can be used to hide converted leads from normal views
- Address data is automatically copied during conversion