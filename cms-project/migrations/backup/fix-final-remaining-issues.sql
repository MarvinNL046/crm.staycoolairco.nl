-- Final fix for remaining auth.uid() issues

BEGIN;

-- 1. Fix activities table - INSERT policy with WITH CHECK
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" ON public.activities
AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

-- 2. Fix platform_settings table - consolidate multiple policies
DROP POLICY IF EXISTS "Only super admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Only super admins can view platform settings" ON public.platform_settings;
-- Create single policy for all operations
CREATE POLICY "Super admins can access platform settings" ON public.platform_settings
AS PERMISSIVE FOR ALL TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (SELECT auth.uid()))
));

-- 3. Fix profiles table
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
AS PERMISSIVE FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (id = (SELECT auth.uid())));

-- 4. Fix super_admins table
DROP POLICY IF EXISTS "Only super admins can view super admin list" ON public.super_admins;
CREATE POLICY "Only super admins can view super admin list" ON public.super_admins
AS PERMISSIVE FOR SELECT TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins sa
  WHERE (sa.user_id = (SELECT auth.uid()))
));

-- 5. Fix system_audit_log table
DROP POLICY IF EXISTS "View audit logs" ON public.system_audit_log;
CREATE POLICY "View audit logs" ON public.system_audit_log
AS PERMISSIVE FOR SELECT TO public
USING (
  (actor_id = (SELECT auth.uid())) OR
  EXISTS (
    SELECT 1
    FROM super_admins
    WHERE (super_admins.user_id = (SELECT auth.uid()))
  )
);

-- 6. Fix tenants table
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
CREATE POLICY "Authenticated users can view tenants" ON public.tenants
AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1
  FROM user_tenants
  WHERE ((user_tenants.tenant_id = tenants.id) AND (user_tenants.user_id = (SELECT auth.uid())))
));

-- 7. Fix user_tenants table - both policies
DROP POLICY IF EXISTS "Users can manage their tenant associations" ON public.user_tenants;
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.user_tenants;

-- Create consolidated policy for user_tenants
CREATE POLICY "Users can manage their own tenant associations" ON public.user_tenants
AS PERMISSIVE FOR ALL TO public
USING (user_id = (SELECT auth.uid()));

-- 8. Now fix the 2 remaining functions
-- First, let's see what they are
DO $$
DECLARE
    func_rec RECORD;
    new_body TEXT;
BEGIN
    FOR func_rec IN 
        SELECT 
            p.proname,
            p.oid,
            p.prosrc,
            pg_get_function_identity_arguments(p.oid) as identity_args,
            pg_get_function_result(p.oid) as result_type,
            p.prosecdef as security_definer,
            p.provolatile,
            p.prolang,
            l.lanname,
            p.prosrc as original_source
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
          AND p.prosrc LIKE '%auth.uid()%'
          AND p.prosrc NOT LIKE '%(SELECT auth.uid())%'
          AND p.proname != 'get_user_tenant_id'
    LOOP
        -- Log what we found
        RAISE NOTICE 'Found function: % with args: %', func_rec.proname, func_rec.identity_args;
        
        -- Replace auth.uid() with (SELECT auth.uid())
        new_body := regexp_replace(func_rec.original_source, '(?<![(\s])auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        
        -- Drop and recreate the function
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s)', func_rec.proname, func_rec.identity_args);
        
        -- Recreate with proper settings
        EXECUTE format(
            'CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE %s %s %s AS %L',
            func_rec.proname,
            func_rec.identity_args,
            func_rec.result_type,
            func_rec.lanname,
            CASE WHEN func_rec.security_definer THEN 'SECURITY DEFINER' ELSE '' END,
            CASE 
                WHEN func_rec.provolatile = 'i' THEN 'IMMUTABLE'
                WHEN func_rec.provolatile = 's' THEN 'STABLE'
                ELSE 'VOLATILE'
            END,
            new_body
        );
        
        -- Set search path if it was a security definer function
        IF func_rec.security_definer THEN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, auth', func_rec.proname, func_rec.identity_args);
        END IF;
        
        RAISE NOTICE 'Fixed function: %', func_rec.proname;
    END LOOP;
END $$;

COMMIT;

-- Final verification
SELECT 
    'Final Verification' as status,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid())%') as functions_with_issues,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%') as policies_qual_issues,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%') as policies_check_issues;

-- Show any remaining issues for debugging
SELECT 
    'Remaining Issues' as debug_info,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'qual'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'with_check'
    END as issue_in
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%')
    OR
    (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%')
  );