-- Fix the foreign key constraint issue for system_audit_log
BEGIN;

-- First, check if the system_audit_log table exists and what constraints it has
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'system_audit_log') THEN
        
        -- Drop the problematic foreign key constraint
        ALTER TABLE public.system_audit_log 
        DROP CONSTRAINT IF EXISTS system_audit_log_actor_id_fkey;
        
        -- Recreate it with CASCADE DELETE so when a user is deleted, 
        -- their audit log entries are also deleted
        ALTER TABLE public.system_audit_log
        ADD CONSTRAINT system_audit_log_actor_id_fkey 
        FOREIGN KEY (actor_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed system_audit_log foreign key constraint to cascade on delete';
    ELSE
        RAISE NOTICE 'system_audit_log table does not exist';
    END IF;
END $$;

-- Also check for any other tables that might have similar issues
-- Check profiles table
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    
    -- Recreate with CASCADE
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed profiles foreign key constraint';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update profiles constraint: %', SQLERRM;
END $$;

-- Check leads table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'leads' 
               AND column_name = 'assigned_to') THEN
        
        -- Drop existing constraint if it exists
        ALTER TABLE public.leads 
        DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
        
        -- Recreate with SET NULL (we don't want to delete leads when a user is deleted)
        ALTER TABLE public.leads
        ADD CONSTRAINT leads_assigned_to_fkey 
        FOREIGN KEY (assigned_to) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed leads foreign key constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update leads constraint: %', SQLERRM;
END $$;

-- Check quotes table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'quotes' 
               AND column_name = 'created_by') THEN
        
        -- Drop existing constraint if it exists
        ALTER TABLE public.quotes 
        DROP CONSTRAINT IF EXISTS quotes_created_by_fkey;
        
        -- Recreate with SET NULL
        ALTER TABLE public.quotes
        ADD CONSTRAINT quotes_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES auth.users(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Fixed quotes foreign key constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update quotes constraint: %', SQLERRM;
END $$;

COMMIT;

-- Verify the constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name IN ('actor_id', 'id', 'assigned_to', 'created_by')
ORDER BY tc.table_name, tc.constraint_name;