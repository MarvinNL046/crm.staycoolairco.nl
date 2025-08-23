-- Fix get_user_tenant_id function to optimize auth.uid() calls

-- First, let's see all versions of the function
SELECT 
    p.oid,
    p.proname,
    p.pronargs,
    p.proargtypes,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc,
    n.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_user_tenant_id'
ORDER BY p.oid;

-- Drop all existing versions and create optimized version
BEGIN;

-- Drop existing functions (both versions)
DROP FUNCTION IF EXISTS public.get_user_tenant_id();
DROP FUNCTION IF EXISTS public.get_user_tenant_id(uuid);

-- Create optimized version that uses subquery for auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid())
$$;

-- Also ensure the function has proper search path
ALTER FUNCTION public.get_user_tenant_id() SET search_path = public, auth;

COMMIT;

-- Now let's also check if there are any other auth functions that need fixing
SELECT 
    p.proname,
    p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid())%'
  AND p.prosrc NOT LIKE '%(select auth.uid())%'
ORDER BY p.proname;

-- Verify the function is now optimized
SELECT 
    proname,
    prosrc,
    CASE 
        WHEN prosrc LIKE '%(SELECT auth.uid())%' THEN '✅ Optimized'
        WHEN prosrc LIKE '%auth.uid()%' THEN '❌ Not optimized'
        ELSE '✅ No auth.uid()'
    END as status
FROM pg_proc
WHERE proname = 'get_user_tenant_id'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');