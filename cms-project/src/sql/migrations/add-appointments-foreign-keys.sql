-- Add foreign key constraints to appointments table
-- Run this after leads, contacts, and customers tables exist

-- Check if leads table exists and add foreign key
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'appointments_lead_id_fkey') THEN
      ALTER TABLE appointments 
      ADD CONSTRAINT appointments_lead_id_fkey 
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Check if contacts table exists and add foreign key
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'appointments_contact_id_fkey') THEN
      ALTER TABLE appointments 
      ADD CONSTRAINT appointments_contact_id_fkey 
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Check if customers table exists and add foreign key
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'appointments_customer_id_fkey') THEN
      ALTER TABLE appointments 
      ADD CONSTRAINT appointments_customer_id_fkey 
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;