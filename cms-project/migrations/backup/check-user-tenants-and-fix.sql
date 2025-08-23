-- Check user_tenants structure and create appropriate fix

-- 1. Show user_tenants columns
SELECT 
    'USER_TENANTS COLUMNS:' as info,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_tenants'
GROUP BY table_schema, table_name;

-- 2. Show current user_tenants policies
SELECT 
    'CURRENT USER_TENANTS POLICIES:' as info,
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_tenants';

-- Now let's fix everything systematically
BEGIN;

-- Fix 1: Drop and recreate get_user_tenant_id with optimization
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

-- Fix 2: Fix the user_tenants policy without using 'status' column
DROP POLICY IF EXISTS "Users can join invited tenants" ON public.user_tenants;
-- Create a simpler policy that just checks user_id
CREATE POLICY "Users can manage their tenant associations" ON public.user_tenants
FOR ALL TO public
USING ((user_id = (SELECT auth.uid())) OR (tenant_id = get_user_tenant_id()));

-- Fix 3: Fix the activities policy
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" ON public.activities
FOR INSERT TO public
WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

-- Fix 4: Fix the profiles policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (id = (SELECT auth.uid())));

-- Fix 5: Fix the tenants policy
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
CREATE POLICY "Authenticated users can view tenants" ON public.tenants
FOR SELECT TO public
USING (EXISTS (
  SELECT 1
  FROM user_tenants
  WHERE ((user_tenants.tenant_id = tenants.id) AND (user_tenants.user_id = (SELECT auth.uid())))
));

-- Fix 6: Fix all the simple "Authenticated users can manage X" policies
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'leads', 'contacts', 'customers', 'companies', 'invoices', 
        'invoice_items', 'appointments', 'products', 'btw_percentages',
        'tags', 'email_templates', 'campaigns', 'campaign_metrics',
        'pipeline_stages', 'workflows', 'workflow_templates', 'workflow_steps',
        'workflow_executions', 'automation_rules', 'automation_logs',
        'api_keys', 'webhook_logs', 'email_logs', 'appointment_reminders',
        'recurring_appointments'
    ]
    LOOP
        -- Drop existing policy
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage %s" ON public.%I', tbl, tbl);
        
        -- Create new optimized policy
        EXECUTE format('CREATE POLICY "Authenticated users can manage %s" ON public.%I FOR ALL TO public USING (tenant_id = get_user_tenant_id())', tbl, tbl);
        
        RAISE NOTICE 'Fixed policy for %', tbl;
    END LOOP;
END $$;

-- Fix 7: Check if there are other functions that need fixing
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN
        SELECT 
            p.proname,
            p.prosrc
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prosrc LIKE '%auth.uid()%'
          AND p.prosrc NOT LIKE '%(SELECT auth.uid())%'
          AND p.proname != 'get_user_tenant_id'
    LOOP
        RAISE WARNING 'Function % still contains unoptimized auth.uid() - needs manual fix', func_rec.proname;
        RAISE WARNING 'Function body: %', LEFT(func_rec.prosrc, 500);
    END LOOP;
END $$;

COMMIT;

-- Final verification
SELECT 
    'After Fix Summary' as status,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid())%') as functions_remaining,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%') as policies_qual_remaining,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%') as policies_check_remaining;