-- Fix search_path for get_user_tenant_id function
DROP FUNCTION IF EXISTS public.get_user_tenant_id(uuid);

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tenant_id uuid;
BEGIN
    -- Get tenant_id from profiles table
    SELECT p.tenant_id INTO tenant_id
    FROM public.profiles p
    WHERE p.id = user_id;
    
    -- Return the tenant_id (will be NULL if user not found)
    RETURN tenant_id;
END;
$$;

-- Fix search_path for update_leads_search_fts function
DROP FUNCTION IF EXISTS public.update_leads_search_fts();

CREATE OR REPLACE FUNCTION public.update_leads_search_fts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update the search_fts column with concatenated searchable fields
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
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO service_role;

-- Note: Trigger functions typically don't need explicit grants as they're called by the system

-- Verify the functions have been updated
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_user_tenant_id', 'update_leads_search_fts');