-- Fix search_path warnings WITHOUT dropping functions (preserves dependencies)

BEGIN;

-- ========================================
-- 1. Replace get_user_tenant_id with fixed search_path
-- ========================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
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
-- 2. Replace update_profile_on_auth_change with fixed search_path
-- ========================================
CREATE OR REPLACE FUNCTION public.update_profile_on_auth_change()
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

-- ========================================
-- 3. Replace update_leads_search_fts with fixed search_path
-- ========================================
CREATE OR REPLACE FUNCTION public.update_leads_search_fts()
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

COMMIT;

-- ========================================
-- 4. Verification
-- ========================================
SELECT 
    'VERIFICATION' as check_type,
    p.proname as function_name,
    p.prosecdef as security_definer,
    CASE 
        WHEN p.proconfig IS NOT NULL AND p.proconfig::text LIKE '%search_path%' 
        THEN '✅ Has search_path: ' || array_to_string(p.proconfig, ', ')
        ELSE '❌ NO SEARCH PATH'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proname IN ('get_user_tenant_id', 'update_profile_on_auth_change', 'update_leads_search_fts')
ORDER BY p.proname;

-- ========================================
-- 5. Count all public functions without search_path
-- ========================================
SELECT 
    'FINAL SECURITY CHECK' as report,
    COUNT(*) FILTER (
        WHERE proconfig IS NULL 
        OR NOT EXISTS (
            SELECT 1 FROM unnest(proconfig) AS config 
            WHERE config LIKE 'search_path%'
        )
    ) as functions_without_path,
    COUNT(*) as total_public_functions,
    CASE 
        WHEN COUNT(*) FILTER (
            WHERE proconfig IS NULL 
            OR NOT EXISTS (
                SELECT 1 FROM unnest(proconfig) AS config 
                WHERE config LIKE 'search_path%'
            )
        ) = 0
        THEN '🛡️ FULLY SECURE - All functions have search_path!'
        ELSE '⚠️ ' || COUNT(*) FILTER (
            WHERE proconfig IS NULL 
            OR NOT EXISTS (
                SELECT 1 FROM unnest(proconfig) AS config 
                WHERE config LIKE 'search_path%'
            )
        ) || ' functions still need search_path'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f';