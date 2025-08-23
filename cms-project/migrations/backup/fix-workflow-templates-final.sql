-- Fix the final workflow_templates issues

-- First, let's see what policies exist on workflow_templates
SELECT 
    'Current workflow_templates policies:' as info,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'workflow_templates'
ORDER BY policyname;

-- Fix the issues
BEGIN;

-- Remove all existing policies on workflow_templates
DROP POLICY IF EXISTS "Authenticated users can manage workflow_templates" ON public.workflow_templates;
DROP POLICY IF EXISTS "Authenticated users can view workflow templates" ON public.workflow_templates;
DROP POLICY IF EXISTS "Authenticated users can manage workflow templates" ON public.workflow_templates;

-- Create a single optimized policy for workflow_templates
-- Since templates are typically shared resources, we'll make them viewable by all authenticated users
CREATE POLICY "Authenticated users can view workflow templates" ON public.workflow_templates
AS PERMISSIVE FOR SELECT TO public
USING (true);  -- Templates are public to all authenticated users

-- If you need more restrictive access, use this instead:
-- CREATE POLICY "Authenticated users can view workflow templates" ON public.workflow_templates
-- AS PERMISSIVE FOR SELECT TO public
-- USING (tenant_id = get_user_tenant_id());

COMMIT;

-- Now let's clean up all the v2 and v3 policies we created earlier
BEGIN;

-- Remove all v2 policies
DROP POLICY IF EXISTS "users_create_activities_v2" ON public.activities;
DROP POLICY IF EXISTS "super_admins_platform_settings_v2" ON public.platform_settings;
DROP POLICY IF EXISTS "auth_users_view_profiles_v2" ON public.profiles;
DROP POLICY IF EXISTS "super_admins_view_list_v2" ON public.super_admins;
DROP POLICY IF EXISTS "view_audit_logs_v2" ON public.system_audit_log;
DROP POLICY IF EXISTS "auth_users_view_tenants_v2" ON public.tenants;
DROP POLICY IF EXISTS "users_manage_tenant_assoc_v2" ON public.user_tenants;

-- Remove all v3 policies  
DROP POLICY IF EXISTS "users_create_activities_v3" ON public.activities;
DROP POLICY IF EXISTS "super_admins_platform_settings_v3" ON public.platform_settings;
DROP POLICY IF EXISTS "auth_users_view_profiles_v3" ON public.profiles;
DROP POLICY IF EXISTS "super_admins_view_list_v3" ON public.super_admins;
DROP POLICY IF EXISTS "view_audit_logs_v3" ON public.system_audit_log;
DROP POLICY IF EXISTS "auth_users_view_tenants_v3" ON public.tenants;
DROP POLICY IF EXISTS "users_manage_tenant_assoc_v3" ON public.user_tenants;

COMMIT;

-- Final check for all issues
SELECT 
    'FINAL CHECK - ALL ISSUES' as status;

-- Check functions
SELECT 
    'Functions with auth.uid() issues' as check_type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid())%';

-- Check policies
SELECT 
    'Policies with auth.uid() issues' as check_type,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%')
    OR
    (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%')
  );

-- Check duplicate policies
SELECT 
    'Tables with multiple permissive policies' as check_type,
    COUNT(DISTINCT tablename || '_' || cmd) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

-- Show any remaining duplicate policies
SELECT 
    'Remaining duplicate policies:' as info,
    tablename,
    cmd,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;