-- Fix security warnings about mutable search_path in functions
-- This prevents potential security issues from schema manipulation

BEGIN;

-- ========================================
-- 1. Fix get_user_tenant_id function
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        LIMIT 1
    );
END;
$$;

-- ========================================
-- 2. Fix update_profile_on_auth_change function
-- ========================================
CREATE OR REPLACE FUNCTION public.update_profile_on_auth_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simply update the profile's last_sign_in_at and last_active_at to NOW()
    -- whenever the auth.users record is updated (which happens on login)
    UPDATE public.profiles 
    SET 
        last_sign_in_at = NOW(),
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- ========================================
-- 3. Fix update_leads_search_fts function
-- ========================================
CREATE OR REPLACE FUNCTION public.update_leads_search_fts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Update the search_fts column with a tsvector combining all searchable fields
    NEW.search_fts := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.company, '') || ' ' ||
        COALESCE(NEW.city, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.status, '') || ' ' ||
        COALESCE(NEW.source, '')
    );
    RETURN NEW;
END;
$$;

-- ========================================
-- 4. Check for any other functions without search_path
-- ========================================
SELECT 
    'VERIFICATION: Functions without search_path' as check_type,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosecdef as is_security_definer,
    CASE 
        WHEN p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=public'] OR p.proconfig::text[] LIKE '%search_path%')
        THEN '⚠️ No search_path set'
        ELSE '✅ Has search_path'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND (p.proconfig IS NULL OR NOT (p.proconfig::text[] @> ARRAY['search_path=public'] OR p.proconfig::text[] LIKE '%search_path%'))
ORDER BY p.proname;

COMMIT;

-- ========================================
-- 5. Final security verification
-- ========================================
SELECT 
    'FINAL STATUS' as check,
    COUNT(*) FILTER (WHERE proconfig IS NULL OR NOT (proconfig::text[] @> ARRAY['search_path=public'] OR proconfig::text[] LIKE '%search_path%')) as functions_without_path,
    COUNT(*) FILTER (WHERE proconfig IS NOT NULL AND (proconfig::text[] @> ARRAY['search_path=public'] OR proconfig::text[] LIKE '%search_path%')) as functions_with_path,
    CASE 
        WHEN COUNT(*) FILTER (WHERE proconfig IS NULL OR NOT (proconfig::text[] @> ARRAY['search_path=public'] OR proconfig::text[] LIKE '%search_path%')) = 0
        THEN '✅ All functions have search_path - SECURE'
        ELSE '⚠️ ' || COUNT(*) FILTER (WHERE proconfig IS NULL OR NOT (proconfig::text[] @> ARRAY['search_path=public'] OR proconfig::text[] LIKE '%search_path%')) || ' functions still need search_path'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f';