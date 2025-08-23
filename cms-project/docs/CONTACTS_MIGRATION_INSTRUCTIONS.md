# Contacts Table Migration Instructions

The contacts table needs to be updated to include all the necessary columns for the CRM system to work properly.

## Current Issue

The contacts table currently only has these columns:
- id
- tenant_id  
- name
- email
- phone
- company (should be renamed to company_name)
- created_at
- updated_at

## Migration Steps

1. **Go to Supabase Dashboard**
   - Log in to your Supabase project
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the entire contents of: `src/sql/migrations/add-missing-contacts-columns.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

3. **Verify the Migration**
   - After running, you should see success messages
   - The contacts table will now have all required columns

## What the Migration Does

- Adds missing columns like:
  - mobile, job_title, department
  - status, relationship_status, temperature
  - Address fields (address_line1, city, postal_code, etc.)
  - Communication preferences (do_not_call, do_not_email)
  - Social media fields
  - Tags and notes
  - Metadata fields
- Renames `company` to `company_name` for consistency
- Adds `company_id` for future company relationships
- Creates indexes for better performance
- Adds foreign key constraint to leads table

## Temporary Workaround

The application has been updated to work with both the old and new column names:
- It will use `company` if `company_name` doesn't exist
- The API automatically maps between the formats
- Once the migration is run, everything will use the standard names

## After Migration

Once the migration is complete, the contacts module will have full functionality including:
- Complete contact information storage
- Relationship status tracking (prospect, lead, customer, etc.)
- Temperature tracking (hot, warm, cold)
- Address management
- Communication preferences
- Lead conversion tracking
- Tags and categorization