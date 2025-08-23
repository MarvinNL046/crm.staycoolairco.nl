-- Inspect the exact content of problematic policies

-- Check activities WITH CHECK
SELECT 
    'activities with_check:' as policy,
    policyname,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activities'
  AND policyname = 'Users can create activities';

-- Check all other policies with issues
SELECT 
    tablename,
    policyname,
    qual,
    with_check,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Super admins can access platform settings',
    'Authenticated users can view profiles',
    'Only super admins can view super admin list',
    'View audit logs',
    'Authenticated users can view tenants',
    'Users can manage their own tenant associations'
  )
ORDER BY tablename, policyname;

-- Let's force drop and recreate with CASCADE
BEGIN;

-- Force drop all problematic policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT DISTINCT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (
            (tablename = 'activities' AND policyname = 'Users can create activities')
            OR (tablename = 'platform_settings' AND policyname = 'Super admins can access platform settings')
            OR (tablename = 'profiles' AND policyname = 'Authenticated users can view profiles')
            OR (tablename = 'super_admins' AND policyname = 'Only super admins can view super admin list')
            OR (tablename = 'system_audit_log' AND policyname = 'View audit logs')
            OR (tablename = 'tenants' AND policyname = 'Authenticated users can view tenants')
            OR (tablename = 'user_tenants' AND policyname = 'Users can manage their own tenant associations')
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', pol.tablename);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I CASCADE', pol.policyname, pol.tablename);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', pol.tablename);
        RAISE NOTICE 'Forcefully dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- Wait a moment
SELECT pg_sleep(0.1);

-- Now recreate them properly
-- 1. Activities
CREATE POLICY "Users can create activities" ON public.activities
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (
    (tenant_id = get_user_tenant_id()) 
    AND 
    (user_id = (SELECT auth.uid()))
);

-- 2. Platform settings
CREATE POLICY "Super admins can access platform settings" ON public.platform_settings
AS PERMISSIVE FOR ALL TO public
USING (
    EXISTS ( 
        SELECT 1
        FROM super_admins
        WHERE (super_admins.user_id = (SELECT auth.uid()))
    )
);

-- 3. Profiles
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
AS PERMISSIVE FOR SELECT TO public
USING (
    (tenant_id = get_user_tenant_id()) 
    OR 
    (id = (SELECT auth.uid()))
);

-- 4. Super admins
CREATE POLICY "Only super admins can view super admin list" ON public.super_admins
AS PERMISSIVE FOR SELECT TO public
USING (
    EXISTS ( 
        SELECT 1
        FROM super_admins sa
        WHERE (sa.user_id = (SELECT auth.uid()))
    )
);

-- 5. System audit log
CREATE POLICY "View audit logs" ON public.system_audit_log
AS PERMISSIVE FOR SELECT TO public
USING (
    (actor_id = (SELECT auth.uid())) 
    OR
    EXISTS (
        SELECT 1
        FROM super_admins
        WHERE (super_admins.user_id = (SELECT auth.uid()))
    )
);

-- 6. Tenants
CREATE POLICY "Authenticated users can view tenants" ON public.tenants
AS PERMISSIVE FOR SELECT TO public
USING (
    EXISTS (
        SELECT 1
        FROM user_tenants
        WHERE (
            (user_tenants.tenant_id = tenants.id) 
            AND 
            (user_tenants.user_id = (SELECT auth.uid()))
        )
    )
);

-- 7. User tenants
CREATE POLICY "Users can manage their own tenant associations" ON public.user_tenants
AS PERMISSIVE FOR ALL TO public
USING (
    user_id = (SELECT auth.uid())
);

COMMIT;

-- Verify the fixes worked
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(select auth.uid())%' THEN '✅ Fixed'
        WHEN qual LIKE '%auth.uid()%' THEN '❌ Still has issue'
        ELSE '✅ No auth.uid()'
    END as qual_status,
    CASE 
        WHEN with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(select auth.uid())%' THEN '✅ Fixed'
        WHEN with_check LIKE '%auth.uid()%' THEN '❌ Still has issue'
        WHEN with_check IS NULL THEN 'N/A'
        ELSE '✅ No auth.uid()'
    END as with_check_status
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
ORDER BY tablename, policyname;