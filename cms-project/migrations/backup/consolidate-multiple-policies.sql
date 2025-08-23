-- Consolidate multiple permissive policies for better performance
-- Multiple permissive policies on the same table/action are inefficient

BEGIN;

-- 1. Fix expenses table - Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view their tenant's expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their created expenses" ON public.expenses;

-- Create consolidated policies for expenses
CREATE POLICY "Users can view expenses" ON public.expenses
AS PERMISSIVE FOR SELECT TO public
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create expenses" ON public.expenses
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update expenses" ON public.expenses
AS PERMISSIVE FOR UPDATE TO public
USING (
  (tenant_id = get_user_tenant_id()) AND 
  (
    (created_by = (SELECT auth.uid())) OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
    )
  )
);

CREATE POLICY "Admins can delete expenses" ON public.expenses
AS PERMISSIVE FOR DELETE TO public
USING (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

-- 2. Fix platform_settings table - Consolidate SELECT policies
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

-- 3. Fix system_audit_log table - Consolidate SELECT policies
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.system_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.system_audit_log;

-- Create single policy for viewing
CREATE POLICY "Users can view audit logs" ON public.system_audit_log
AS PERMISSIVE FOR SELECT TO public
USING (
  (actor_id = (SELECT auth.uid())) OR
  EXISTS (
    SELECT 1
    FROM super_admins
    WHERE (super_admins.user_id = (SELECT auth.uid()))
  )
);

-- 4. Fix team_members table - Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;

-- Create consolidated policies
CREATE POLICY "Users can view team members" ON public.team_members
AS PERMISSIVE FOR SELECT TO public
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage team members" ON public.team_members
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

CREATE POLICY "Admins can update team members" ON public.team_members
AS PERMISSIVE FOR UPDATE TO public
USING (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

CREATE POLICY "Admins can delete team members" ON public.team_members
AS PERMISSIVE FOR DELETE TO public
USING (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

-- 5. Fix tenant_users table - Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.tenant_users;

-- Create consolidated policies
CREATE POLICY "Users can view tenant users" ON public.tenant_users
AS PERMISSIVE FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (user_id = (SELECT auth.uid())));

CREATE POLICY "Admins can manage tenant users" ON public.tenant_users
AS PERMISSIVE FOR INSERT TO public
WITH CHECK (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

CREATE POLICY "Admins can update tenant users" ON public.tenant_users
AS PERMISSIVE FOR UPDATE TO public
USING (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

CREATE POLICY "Admins can delete tenant users" ON public.tenant_users
AS PERMISSIVE FOR DELETE TO public
USING (
  (tenant_id = get_user_tenant_id()) AND 
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
  )
);

COMMIT;

-- Verify consolidation
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'platform_settings', 'system_audit_log', 'team_members', 'tenant_users')
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;