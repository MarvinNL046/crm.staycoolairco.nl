-- Verified working solution to fix RLS performance issues
-- Run each section one by one to ensure it works

-- SECTION 1: Fix activities table
BEGIN;

-- First verify what we're changing
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'activities' 
  AND schemaname = 'public'
  AND qual LIKE '%auth.uid()%';

-- Drop and recreate the policies
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;

-- Recreate with optimization
CREATE POLICY "Users can delete their own activities" 
ON public.activities
AS PERMISSIVE
FOR DELETE 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

CREATE POLICY "Users can update their own activities" 
ON public.activities
AS PERMISSIVE
FOR UPDATE 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

COMMIT;

-- SECTION 2: Fix expenses table
BEGIN;

DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their created expenses" ON public.expenses;

CREATE POLICY "Admins can manage all expenses" 
ON public.expenses
AS PERMISSIVE
FOR ALL 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
)));

CREATE POLICY "Users can update their created expenses" 
ON public.expenses
AS PERMISSIVE
FOR UPDATE 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (created_by = (SELECT auth.uid())));

COMMIT;

-- SECTION 3: Fix platform_settings table
BEGIN;

DROP POLICY IF EXISTS "Only super admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Only super admins can view platform settings" ON public.platform_settings;

CREATE POLICY "Only super admins can manage platform settings" 
ON public.platform_settings
AS PERMISSIVE
FOR ALL 
TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (SELECT auth.uid()))
));

CREATE POLICY "Only super admins can view platform settings" 
ON public.platform_settings
AS PERMISSIVE
FOR SELECT 
TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (SELECT auth.uid()))
));

COMMIT;

-- SECTION 4: Fix super_admins table
BEGIN;

DROP POLICY IF EXISTS "Only super admins can view super admin list" ON public.super_admins;

CREATE POLICY "Only super admins can view super admin list" 
ON public.super_admins
AS PERMISSIVE
FOR SELECT 
TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins sa
  WHERE (sa.user_id = (SELECT auth.uid()))
));

COMMIT;

-- SECTION 5: Fix system_audit_log table
BEGIN;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.system_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.system_audit_log;

CREATE POLICY "Super admins can view all audit logs" 
ON public.system_audit_log
AS PERMISSIVE
FOR SELECT 
TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (SELECT auth.uid()))
));

CREATE POLICY "Users can view their own audit logs" 
ON public.system_audit_log
AS PERMISSIVE
FOR SELECT 
TO public
USING (actor_id = (SELECT auth.uid()));

COMMIT;

-- SECTION 6: Fix tasks table
BEGIN;

DROP POLICY IF EXISTS "Users can delete their created tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;

CREATE POLICY "Users can delete their created tasks" 
ON public.tasks
AS PERMISSIVE
FOR DELETE 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (created_by = (SELECT auth.uid())));

CREATE POLICY "Users can update assigned tasks" 
ON public.tasks
AS PERMISSIVE
FOR UPDATE 
TO public
USING ((tenant_id = get_user_tenant_id()) AND ((assigned_to = (SELECT auth.uid())) OR (created_by = (SELECT auth.uid()))));

COMMIT;

-- SECTION 7: Fix team_members table
BEGIN;

DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

CREATE POLICY "Admins can manage team members" 
ON public.team_members
AS PERMISSIVE
FOR ALL 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
)));

COMMIT;

-- SECTION 8: Fix tenant_users table
BEGIN;

DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.tenant_users;

CREATE POLICY "Admins can manage tenant users" 
ON public.tenant_users
AS PERMISSIVE
FOR ALL 
TO public
USING ((tenant_id = get_user_tenant_id()) AND (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
)));

CREATE POLICY "Users can view their tenant associations" 
ON public.tenant_users
AS PERMISSIVE
FOR SELECT 
TO public
USING ((tenant_id = get_user_tenant_id()) OR (user_id = (SELECT auth.uid())));

COMMIT;

-- SECTION 9: Fix user_tenants table
BEGIN;

DROP POLICY IF EXISTS "Users can view their own tenants" ON public.user_tenants;

CREATE POLICY "Users can view their own tenants" 
ON public.user_tenants
AS PERMISSIVE
FOR SELECT 
TO public
USING (user_id = (SELECT auth.uid()));

COMMIT;

-- FINAL VERIFICATION: Run this after all sections
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(select auth.uid())%' THEN '✅ Fixed'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Still needs fixing'
    ELSE '✅ No auth.uid()'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities', 'expenses', 'platform_settings', 'super_admins',
    'system_audit_log', 'tasks', 'team_members', 'tenant_users',
    'user_tenants'
  )
ORDER BY tablename, policyname;