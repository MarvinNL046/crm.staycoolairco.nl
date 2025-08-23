-- Add 'converted' status to invoices table
-- This script should be run in Supabase SQL Editor

-- First, check if the status column has constraints
-- If there's a CHECK constraint, we need to modify it

-- Option 1: If there's no constraint, this should work:
-- ALTER TABLE invoices ADD CONSTRAINT check_status 
-- CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'converted'));

-- Option 2: If there's an existing constraint, we need to drop and recreate it
-- First drop any existing constraint
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find existing check constraint on status column
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = con.conrelid
    WHERE rel.relname = 'invoices' 
    AND att.attname = 'status'
    AND con.contype = 'c';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE invoices DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the new constraint with 'converted' and 'accepted' status
ALTER TABLE invoices ADD CONSTRAINT check_invoices_status 
CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'converted', 'accepted'));

-- Update any existing quotes with invalid status to 'draft'
UPDATE invoices 
SET status = 'draft' 
WHERE status NOT IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'converted', 'accepted');