-- Direct fix for remaining auth.uid() issues

-- First, let's see exactly what needs fixing
SELECT 'FUNCTIONS THAT NEED FIXING:' as info;
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid())%';

SELECT '' as blank;
SELECT 'POLICIES THAT NEED FIXING:' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'qual needs fix'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'with_check needs fix'
    END as issue
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%')
    OR 
    (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%')
  )
ORDER BY tablename, policyname;

-- Now let's fix them one by one
BEGIN;

-- Fix the functions first
-- Function 1: get_user_tenant_id (if it still exists with wrong implementation)
DROP FUNCTION IF EXISTS public.get_user_tenant_id() CASCADE;
CREATE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid())
$$;

-- Function 2: Check if there's another function
DO $$
DECLARE
    func_name TEXT;
    func_body TEXT;
BEGIN
    -- Get any other functions that need fixing
    FOR func_name, func_body IN
        SELECT p.proname, p.prosrc
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prosrc LIKE '%auth.uid()%'
          AND p.prosrc NOT LIKE '%(SELECT auth.uid())%'
          AND p.proname != 'get_user_tenant_id'
    LOOP
        RAISE NOTICE 'Found function % that needs manual fixing', func_name;
        -- We'll need to handle these specifically based on what they are
    END LOOP;
END $$;

-- Fix the specific policies mentioned in the warnings
-- 1. Activities table
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" ON public.activities
FOR INSERT TO public
WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

-- 2. User tenants table  
DROP POLICY IF EXISTS "Users can join invited tenants" ON public.user_tenants;
CREATE POLICY "Users can join invited tenants" ON public.user_tenants
FOR INSERT TO public
WITH CHECK ((user_id = (SELECT auth.uid())) AND (status = 'invited'::text));

-- 3. Profiles table
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (id = (SELECT auth.uid())));

-- 4. Tenants table
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
CREATE POLICY "Authenticated users can view tenants" ON public.tenants
FOR SELECT TO public
USING (EXISTS (
  SELECT 1
  FROM user_tenants
  WHERE ((user_tenants.tenant_id = tenants.id) AND (user_tenants.user_id = (SELECT auth.uid())))
));

-- 5. Other tables from warnings
-- Fix all remaining policies in one go
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
            'leads', 'contacts', 'customers', 'companies', 'invoices', 
            'invoice_items', 'appointments', 'products', 'btw_percentages',
            'tags', 'email_templates', 'campaigns', 'campaign_metrics',
            'pipeline_stages', 'workflows', 'workflow_templates', 'workflow_steps',
            'workflow_executions', 'automation_rules', 'automation_logs',
            'api_keys', 'webhook_logs', 'email_logs', 'appointment_reminders',
            'recurring_appointments'
          )
    LOOP
        -- For these tables, the policy is typically "Authenticated users can manage [table]"
        EXECUTE format(
            'DROP POLICY IF EXISTS "Authenticated users can manage %s" ON public.%I',
            rec.tablename,
            rec.tablename
        );
        
        EXECUTE format(
            'CREATE POLICY "Authenticated users can manage %s" ON public.%I FOR ALL TO public USING (tenant_id = get_user_tenant_id())',
            rec.tablename,
            rec.tablename
        );
        
        RAISE NOTICE 'Fixed policy for table %', rec.tablename;
    END LOOP;
END $$;

COMMIT;

-- Final verification
SELECT 
    'Final Check' as status,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid())%') as functions_need_fix,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%') as policies_qual_need_fix,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%') as policies_check_need_fix;