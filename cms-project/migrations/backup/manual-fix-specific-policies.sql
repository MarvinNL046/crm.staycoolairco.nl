-- Manual fix for specific policies that keep having issues

-- First, show me exactly which policies still have problems
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual ~ 'auth\.uid\(\)(?!\s*\))' THEN 'QUAL'
        WHEN with_check ~ 'auth\.uid\(\)(?!\s*\))' THEN 'WITH_CHECK'
    END as problem_in,
    CASE 
        WHEN qual ~ 'auth\.uid\(\)(?!\s*\))' THEN qual
        WHEN with_check ~ 'auth\.uid\(\)(?!\s*\))' THEN with_check
    END as problematic_content
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ~ 'auth\.uid\(\)(?!\s*\))' OR with_check ~ 'auth\.uid\(\)(?!\s*\))')
ORDER BY tablename, policyname;

-- Let me try a different approach - maybe the issue is with the regex
-- Let's look for the exact pattern
SELECT 
    'Checking different patterns:' as info;

SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'Has bare auth.uid() in qual'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'Has bare auth.uid() in with_check'
        ELSE 'Unknown pattern'
    END as issue_type
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%')
    OR
    (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')
  );

-- Now let's manually fix each one
BEGIN;

-- Based on the previous outputs, these are likely the problematic policies:

-- 1. activities table - Users can create activities (with_check issue)
DROP POLICY IF EXISTS "users_create_activities_v2" ON public.activities;
CREATE POLICY "users_create_activities_v3" ON public.activities
AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

-- 2. platform_settings - super_admins_platform_settings_v2
DROP POLICY IF EXISTS "super_admins_platform_settings_v2" ON public.platform_settings;
CREATE POLICY "super_admins_platform_settings_v3" ON public.platform_settings
AS PERMISSIVE FOR ALL TO public
USING (EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = (SELECT auth.uid())));

-- 3. profiles - auth_users_view_profiles_v2
DROP POLICY IF EXISTS "auth_users_view_profiles_v2" ON public.profiles;
CREATE POLICY "auth_users_view_profiles_v3" ON public.profiles
AS PERMISSIVE FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (id = (SELECT auth.uid())));

-- 4. super_admins - super_admins_view_list_v2
DROP POLICY IF EXISTS "super_admins_view_list_v2" ON public.super_admins;
CREATE POLICY "super_admins_view_list_v3" ON public.super_admins
AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM super_admins sa WHERE sa.user_id = (SELECT auth.uid())));

-- 5. system_audit_log - view_audit_logs_v2
DROP POLICY IF EXISTS "view_audit_logs_v2" ON public.system_audit_log;
CREATE POLICY "view_audit_logs_v3" ON public.system_audit_log
AS PERMISSIVE FOR SELECT TO public
USING ((actor_id = (SELECT auth.uid())) OR EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = (SELECT auth.uid())));

-- 6. tenants - auth_users_view_tenants_v2
DROP POLICY IF EXISTS "auth_users_view_tenants_v2" ON public.tenants;
CREATE POLICY "auth_users_view_tenants_v3" ON public.tenants
AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM user_tenants WHERE user_tenants.tenant_id = tenants.id AND user_tenants.user_id = (SELECT auth.uid())));

-- 7. user_tenants - users_manage_tenant_assoc_v2
DROP POLICY IF EXISTS "users_manage_tenant_assoc_v2" ON public.user_tenants;
CREATE POLICY "users_manage_tenant_assoc_v3" ON public.user_tenants
AS PERMISSIVE FOR ALL TO public
USING (user_id = (SELECT auth.uid()));

COMMIT;

-- Check if v3 policies are created and optimized
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ Optimized'
        WHEN qual LIKE '%auth.uid()%' THEN '❌ Not optimized'
        ELSE '✅ No auth.uid()'
    END as qual_status,
    CASE 
        WHEN with_check LIKE '%(SELECT auth.uid())%' THEN '✅ Optimized'
        WHEN with_check LIKE '%auth.uid()%' THEN '❌ Not optimized'
        WHEN with_check IS NULL THEN 'N/A'
        ELSE '✅ No auth.uid()'
    END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_v3'
ORDER BY tablename;

-- Final summary
SELECT 
    'FINAL SUMMARY' as status,
    COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') as qual_issues,
    COUNT(*) FILTER (WHERE with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') as with_check_issues,
    COUNT(*) FILTER (WHERE (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')) as total_issues
FROM pg_policies
WHERE schemaname = 'public';