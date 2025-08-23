-- Fix specific RLS policies with auth.uid() performance issues
-- Based on the actual policies found in your database

BEGIN;

-- 1. Fix activities table policies
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE TO public
USING ((tenant_id = get_user_tenant_id()) AND (user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE TO public
USING ((tenant_id = get_user_tenant_id()) AND (user_id = (select auth.uid())));

-- 2. Fix expenses table policies
DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
CREATE POLICY "Admins can manage all expenses" ON public.expenses
FOR ALL TO public
USING ((tenant_id = get_user_tenant_id()) AND (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
)));

DROP POLICY IF EXISTS "Users can update their created expenses" ON public.expenses;
CREATE POLICY "Users can update their created expenses" ON public.expenses
FOR UPDATE TO public
USING ((tenant_id = get_user_tenant_id()) AND (created_by = (select auth.uid())));

-- 3. Fix platform_settings table policies
DROP POLICY IF EXISTS "Only super admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Only super admins can manage platform settings" ON public.platform_settings
FOR ALL TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (select auth.uid()))
));

DROP POLICY IF EXISTS "Only super admins can view platform settings" ON public.platform_settings;
CREATE POLICY "Only super admins can view platform settings" ON public.platform_settings
FOR SELECT TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (select auth.uid()))
));

-- 4. Fix super_admins table policy
DROP POLICY IF EXISTS "Only super admins can view super admin list" ON public.super_admins;
CREATE POLICY "Only super admins can view super admin list" ON public.super_admins
FOR SELECT TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins sa
  WHERE (sa.user_id = (select auth.uid()))
));

-- 5. Fix system_audit_log table policies
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.system_audit_log;
CREATE POLICY "Super admins can view all audit logs" ON public.system_audit_log
FOR SELECT TO public
USING (EXISTS ( 
  SELECT 1
  FROM super_admins
  WHERE (super_admins.user_id = (select auth.uid()))
));

DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.system_audit_log;
CREATE POLICY "Users can view their own audit logs" ON public.system_audit_log
FOR SELECT TO public
USING (actor_id = (select auth.uid()));

-- 6. Fix tasks table policies
DROP POLICY IF EXISTS "Users can delete their created tasks" ON public.tasks;
CREATE POLICY "Users can delete their created tasks" ON public.tasks
FOR DELETE TO public
USING ((tenant_id = get_user_tenant_id()) AND (created_by = (select auth.uid())));

DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;
CREATE POLICY "Users can update assigned tasks" ON public.tasks
FOR UPDATE TO public
USING ((tenant_id = get_user_tenant_id()) AND ((assigned_to = (select auth.uid())) OR (created_by = (select auth.uid()))));

-- 7. Fix team_members table policy
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members
FOR ALL TO public
USING ((tenant_id = get_user_tenant_id()) AND (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
)));

-- 8. Fix tenant_users table policies
DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
CREATE POLICY "Admins can manage tenant users" ON public.tenant_users
FOR ALL TO public
USING ((tenant_id = get_user_tenant_id()) AND (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
)));

DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.tenant_users;
CREATE POLICY "Users can view their tenant associations" ON public.tenant_users
FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (user_id = (select auth.uid())));

-- 9. Fix user_tenants table policy
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.user_tenants;
CREATE POLICY "Users can view their own tenants" ON public.user_tenants
FOR SELECT TO public
USING (user_id = (select auth.uid()));

-- Also fix the remaining tables mentioned in the warnings
-- 10. Fix profiles table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'profiles' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 11. Fix tenants table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'tenants' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 12. Fix leads table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'leads' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 13. Fix contacts table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'contacts' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 14. Fix customers table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'customers' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 15. Fix companies table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'companies' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 16. Fix invoices table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'invoices' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 17. Fix invoice_items table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'invoice_items' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- 18. Fix appointments table policy
UPDATE pg_policies SET qual = replace(qual, 'auth.uid()', '(select auth.uid())')
WHERE tablename = 'appointments' AND schemaname = 'public' AND qual LIKE '%auth.uid()%';

-- Continue for all other tables...

COMMIT;

-- Verify the fixes
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Fixed'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Still needs fixing'
    ELSE '✅ No auth.uid()'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities', 'expenses', 'platform_settings', 'super_admins',
    'system_audit_log', 'tasks', 'team_members', 'tenant_users',
    'user_tenants', 'profiles', 'tenants', 'leads', 'contacts'
  )
ORDER BY tablename, policyname;