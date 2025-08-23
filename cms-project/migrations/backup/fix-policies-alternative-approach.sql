-- Alternative approach - check exact policy content and fix differently

-- First, let's see the EXACT content of these policies
SELECT 
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Users can create activities',
    'Super admins can access platform settings',
    'Authenticated users can view profiles',
    'Only super admins can view super admin list',
    'View audit logs',
    'Authenticated users can view tenants',
    'Users can manage their own tenant associations'
  )
ORDER BY tablename;

-- Try a different approach - maybe the policies are being recreated by triggers or other functions
BEGIN;

-- 1. Drop and recreate with different names to avoid conflicts
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "users_create_activities_v2" ON public.activities
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (
    (tenant_id = get_user_tenant_id()) 
    AND 
    (user_id = (SELECT auth.uid() AS uid))
);

DROP POLICY IF EXISTS "Super admins can access platform settings" ON public.platform_settings;
CREATE POLICY "super_admins_platform_settings_v2" ON public.platform_settings
AS PERMISSIVE FOR ALL TO public
USING (
    EXISTS ( 
        SELECT 1
        FROM super_admins
        WHERE (super_admins.user_id = (SELECT auth.uid() AS uid))
    )
);

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "auth_users_view_profiles_v2" ON public.profiles
AS PERMISSIVE FOR SELECT TO public
USING (
    (tenant_id = get_user_tenant_id()) 
    OR 
    (id = (SELECT auth.uid() AS uid))
);

DROP POLICY IF EXISTS "Only super admins can view super admin list" ON public.super_admins;
CREATE POLICY "super_admins_view_list_v2" ON public.super_admins
AS PERMISSIVE FOR SELECT TO public
USING (
    EXISTS ( 
        SELECT 1
        FROM super_admins sa
        WHERE (sa.user_id = (SELECT auth.uid() AS uid))
    )
);

DROP POLICY IF EXISTS "View audit logs" ON public.system_audit_log;
CREATE POLICY "view_audit_logs_v2" ON public.system_audit_log
AS PERMISSIVE FOR SELECT TO public
USING (
    (actor_id = (SELECT auth.uid() AS uid)) 
    OR
    EXISTS (
        SELECT 1
        FROM super_admins
        WHERE (super_admins.user_id = (SELECT auth.uid() AS uid))
    )
);

DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
CREATE POLICY "auth_users_view_tenants_v2" ON public.tenants
AS PERMISSIVE FOR SELECT TO public
USING (
    EXISTS (
        SELECT 1
        FROM user_tenants
        WHERE (
            (user_tenants.tenant_id = tenants.id) 
            AND 
            (user_tenants.user_id = (SELECT auth.uid() AS uid))
        )
    )
);

DROP POLICY IF EXISTS "Users can manage their own tenant associations" ON public.user_tenants;
CREATE POLICY "users_manage_tenant_assoc_v2" ON public.user_tenants
AS PERMISSIVE FOR ALL TO public
USING (
    user_id = (SELECT auth.uid() AS uid)
);

COMMIT;

-- Check if the new policies are optimized
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(SELECT auth.uid()%' THEN '✅ Optimized'
        WHEN qual LIKE '%auth.uid()%' THEN '❌ Not optimized'
        ELSE '✅ No auth.uid()'
    END as qual_status,
    CASE 
        WHEN with_check LIKE '%(SELECT auth.uid()%' THEN '✅ Optimized'
        WHEN with_check LIKE '%auth.uid()%' THEN '❌ Not optimized'
        WHEN with_check IS NULL THEN 'N/A'
        ELSE '✅ No auth.uid()'
    END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_v2'
ORDER BY tablename, policyname;

-- Also check if old policies still exist
SELECT 
    'Old policies that should be gone:' as check,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Users can create activities',
    'Super admins can access platform settings',
    'Authenticated users can view profiles',
    'Only super admins can view super admin list',
    'View audit logs',
    'Authenticated users can view tenants',
    'Users can manage their own tenant associations'
  );