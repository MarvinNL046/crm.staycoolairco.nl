-- Fix lead status enum to include 'converted'
-- This needs to be run before the lead-contact improvements migration

-- First, we need to check current enum values
-- The existing enum likely has: 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'

-- Method 1: If the constraint is a CHECK constraint (most likely)
-- Drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add new constraint with 'converted' included
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'converted'));

-- Method 2: If it's an actual ENUM type (less common in modern Postgres)
-- You would need to recreate the enum type, which is more complex

-- Now you can safely run the lead-contact improvements migration