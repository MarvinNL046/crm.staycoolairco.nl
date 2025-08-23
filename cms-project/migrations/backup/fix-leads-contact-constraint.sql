-- Fix the foreign key constraint on contacts table that prevents lead deletion

BEGIN;

-- Check current constraint
SELECT 
    'CURRENT CONSTRAINT' as check,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'contacts_converted_from_lead_id_fkey';

-- Drop the existing constraint
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS contacts_converted_from_lead_id_fkey;

-- Recreate with ON DELETE SET NULL
-- This way, when a lead is deleted, the contact remains but the reference is cleared
ALTER TABLE public.contacts
ADD CONSTRAINT contacts_converted_from_lead_id_fkey 
FOREIGN KEY (converted_from_lead_id) 
REFERENCES public.leads(id) 
ON DELETE SET NULL;

-- Also check if there are other similar constraints that might cause issues
SELECT 
    'OTHER LEAD CONSTRAINTS' as check,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'leads'
    AND rc.delete_rule = 'NO ACTION'
ORDER BY tc.table_name;

-- Fix any other constraints referencing leads
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Fix quotes table if it references leads
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' 
        AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE public.quotes 
        DROP CONSTRAINT IF EXISTS quotes_lead_id_fkey;
        
        ALTER TABLE public.quotes
        ADD CONSTRAINT quotes_lead_id_fkey 
        FOREIGN KEY (lead_id) 
        REFERENCES public.leads(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed quotes->leads constraint';
    END IF;
    
    -- Fix deals table if it references leads
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deals' 
        AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE public.deals 
        DROP CONSTRAINT IF EXISTS deals_lead_id_fkey;
        
        ALTER TABLE public.deals
        ADD CONSTRAINT deals_lead_id_fkey 
        FOREIGN KEY (lead_id) 
        REFERENCES public.leads(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed deals->leads constraint';
    END IF;
    
    -- Fix appointments table if it references leads
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE public.appointments 
        DROP CONSTRAINT IF EXISTS appointments_lead_id_fkey;
        
        ALTER TABLE public.appointments
        ADD CONSTRAINT appointments_lead_id_fkey 
        FOREIGN KEY (lead_id) 
        REFERENCES public.leads(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed appointments->leads constraint';
    END IF;
END $$;

COMMIT;

-- Verify all lead constraints are now safe
SELECT 
    'FINAL LEAD CONSTRAINTS' as verification,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule IN ('CASCADE', 'SET NULL') THEN '✅ Safe for deletion'
        ELSE '❌ Will block deletion'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'leads'
ORDER BY 
    CASE WHEN rc.delete_rule IN ('CASCADE', 'SET NULL') THEN 1 ELSE 0 END,
    tc.table_name;