-- Safe version: Fix search_path for security warnings
-- This migration updates functions to have an explicit search_path set to 'public'
-- This prevents potential security issues with search_path manipulation

BEGIN;

-- Fix get_user_tenant_id function
DO $$
DECLARE
    func_exists boolean;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_tenant_id'
    ) INTO func_exists;

    IF func_exists THEN
        -- Get the current function definition
        -- We'll recreate it with SET search_path = public
        CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_id uuid)
        RETURNS uuid
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        DECLARE
            tenant_id uuid;
        BEGIN
            SELECT p.tenant_id INTO tenant_id
            FROM profiles p
            WHERE p.id = user_id;
            
            RETURN tenant_id;
        END;
        $function$;
        
        RAISE NOTICE 'Updated get_user_tenant_id function with secure search_path';
    ELSE
        RAISE NOTICE 'Function get_user_tenant_id not found, skipping';
    END IF;
END $$;

-- Fix update_leads_search_fts function
DO $$
DECLARE
    func_exists boolean;
BEGIN
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_leads_search_fts'
    ) INTO func_exists;

    IF func_exists THEN
        -- Recreate the trigger function with SET search_path = public
        CREATE OR REPLACE FUNCTION public.update_leads_search_fts()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        BEGIN
            NEW.search_fts := to_tsvector('english',
                COALESCE(NEW.name, '') || ' ' ||
                COALESCE(NEW.email, '') || ' ' ||
                COALESCE(NEW.phone, '') || ' ' ||
                COALESCE(NEW.company, '') || ' ' ||
                COALESCE(NEW.notes, '') || ' ' ||
                COALESCE(NEW.source, '') || ' ' ||
                COALESCE(NEW.status, '')
            );
            RETURN NEW;
        END;
        $function$;
        
        RAISE NOTICE 'Updated update_leads_search_fts function with secure search_path';
    ELSE
        RAISE NOTICE 'Function update_leads_search_fts not found, skipping';
    END IF;
END $$;

-- Verify the updates
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%search_path%' THEN 'SECURED'
        ELSE 'NOT SECURED'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_user_tenant_id', 'update_leads_search_fts');

COMMIT;