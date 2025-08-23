-- Fix the 3 remaining security warnings about mutable search_path
-- This is CRITICAL for security to prevent schema manipulation attacks

BEGIN;

-- ========================================
-- 1. Drop and recreate get_user_tenant_id with fixed search_path
-- ========================================
DROP FUNCTION IF EXISTS public.get_user_tenant_id();

CREATE FUNCTION public.get_user_tenant_id()
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM tenant_users 
        WHERE user_id = auth.uid() 
        LIMIT 1
    );
END;
$$;

-- ========================================
-- 2. Drop and recreate update_profile_on_auth_change with fixed search_path
-- ========================================
DROP FUNCTION IF EXISTS public.update_profile_on_auth_change() CASCADE;

CREATE FUNCTION public.update_profile_on_auth_change()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles 
    SET 
        last_sign_in_at = NOW(),
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_profile_activity
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_on_auth_change();

-- ========================================
-- 3. Drop and recreate update_leads_search_fts with fixed search_path
-- ========================================
DROP FUNCTION IF EXISTS public.update_leads_search_fts() CASCADE;

CREATE FUNCTION public.update_leads_search_fts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
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

-- Recreate the trigger if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'leads' 
               AND column_name = 'search_fts') THEN
        CREATE TRIGGER update_leads_search_fts_trigger
            BEFORE INSERT OR UPDATE ON public.leads
            FOR EACH ROW
            EXECUTE FUNCTION public.update_leads_search_fts();
    END IF;
END $$;

COMMIT;

-- ========================================
-- 4. Verification - Check all functions now have search_path
-- ========================================
SELECT 
    'VERIFICATION' as check_type,
    p.proname as function_name,
    CASE 
        WHEN p.proconfig::text LIKE '%search_path%' THEN '✅ Has search_path: ' || p.proconfig::text
        ELSE '❌ NO SEARCH PATH'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proname IN ('get_user_tenant_id', 'update_profile_on_auth_change', 'update_leads_search_fts')
ORDER BY p.proname;

-- ========================================
-- 5. Final count of functions without search_path
-- ========================================
SELECT 
    'FINAL STATUS' as report,
    COUNT(*) FILTER (WHERE proconfig IS NULL OR proconfig::text NOT LIKE '%search_path%') as functions_without_path,
    COUNT(*) as total_functions,
    CASE 
        WHEN COUNT(*) FILTER (WHERE proconfig IS NULL OR proconfig::text NOT LIKE '%search_path%') = 0
        THEN '🛡️ ALL SECURE - All functions have search_path set!'
        ELSE '⚠️ WARNING - ' || COUNT(*) FILTER (WHERE proconfig IS NULL OR proconfig::text NOT LIKE '%search_path%') || ' functions still need search_path'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f';