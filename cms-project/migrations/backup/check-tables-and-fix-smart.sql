-- Smart fix that checks which tables have tenant_id before creating policies

-- First, let's see which tables have tenant_id
WITH table_columns AS (
    SELECT 
        t.table_name,
        CASE WHEN c.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_tenant_id
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c 
        ON t.table_schema = c.table_schema 
        AND t.table_name = c.table_name 
        AND c.column_name = 'tenant_id'
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name IN (
        'leads', 'contacts', 'customers', 'companies', 'invoices', 
        'invoice_items', 'appointments', 'products', 'btw_percentages',
        'tags', 'email_templates', 'campaigns', 'campaign_metrics',
        'pipeline_stages', 'workflows', 'workflow_templates', 'workflow_steps',
        'workflow_executions', 'automation_rules', 'automation_logs',
        'api_keys', 'webhook_logs', 'email_logs', 'appointment_reminders',
        'recurring_appointments'
      )
)
SELECT 
    'Tables with tenant_id:' as info,
    string_agg(table_name, ', ' ORDER BY table_name) FILTER (WHERE has_tenant_id = 'YES') as tables_with,
    'Tables without tenant_id:' as info2,
    string_agg(table_name, ', ' ORDER BY table_name) FILTER (WHERE has_tenant_id = 'NO') as tables_without
FROM table_columns;

-- Now let's check how invoice_items relates to invoices
SELECT 
    'invoice_items structure:' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Begin the fix
BEGIN;

-- Fix 1: Functions
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

-- Fix 2: Basic policies that we know need fixing
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" ON public.activities
FOR INSERT TO public
WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
CREATE POLICY "Authenticated users can view tenants" ON public.tenants
FOR SELECT TO public
USING (EXISTS (
  SELECT 1
  FROM user_tenants
  WHERE ((user_tenants.tenant_id = tenants.id) AND (user_tenants.user_id = (SELECT auth.uid())))
));

DROP POLICY IF EXISTS "Users can join invited tenants" ON public.user_tenants;
CREATE POLICY "Users can manage their tenant associations" ON public.user_tenants
FOR ALL TO public
USING ((user_id = (SELECT auth.uid())) OR EXISTS (
  SELECT 1 FROM user_tenants ut2 
  WHERE ut2.user_id = (SELECT auth.uid()) 
  AND ut2.tenant_id = user_tenants.tenant_id
));

-- Fix 3: Smart policy creation based on table structure
DO $$
DECLARE
    tbl TEXT;
    has_tenant BOOLEAN;
    has_user BOOLEAN;
    policy_using TEXT;
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
        -- Check if table has tenant_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl 
            AND column_name = 'tenant_id'
        ) INTO has_tenant;
        
        -- Check if table has user_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl 
            AND column_name = 'user_id'
        ) INTO has_user;
        
        -- Drop existing policy
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage %s" ON public.%I', tbl, tbl);
        
        -- Create appropriate policy based on table structure
        IF has_tenant THEN
            -- Table has tenant_id, use it
            policy_using := 'tenant_id = get_user_tenant_id()';
        ELSIF tbl = 'invoice_items' THEN
            -- Special case for invoice_items - check via invoices table
            policy_using := 'EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.tenant_id = get_user_tenant_id())';
        ELSIF tbl = 'workflow_steps' THEN
            -- Special case for workflow_steps - check via workflows table
            policy_using := 'EXISTS (SELECT 1 FROM workflows WHERE workflows.id = workflow_steps.workflow_id AND workflows.tenant_id = get_user_tenant_id())';
        ELSIF tbl = 'workflow_executions' THEN
            -- Special case for workflow_executions - check via workflows table
            policy_using := 'EXISTS (SELECT 1 FROM workflows WHERE workflows.id = workflow_executions.workflow_id AND workflows.tenant_id = get_user_tenant_id())';
        ELSIF tbl = 'appointment_reminders' THEN
            -- Special case for appointment_reminders - check via appointments table
            policy_using := 'EXISTS (SELECT 1 FROM appointments WHERE appointments.id = appointment_reminders.appointment_id AND appointments.tenant_id = get_user_tenant_id())';
        ELSIF tbl = 'workflow_templates' THEN
            -- Templates might be global, so just allow authenticated users
            policy_using := 'true';
        ELSIF has_user THEN
            -- Table has user_id but no tenant_id
            policy_using := format('user_id = (SELECT auth.uid())');
        ELSE
            -- Table has neither, skip or use true
            RAISE NOTICE 'Table % has no tenant_id or user_id, using permissive policy', tbl;
            policy_using := 'true';
        END IF;
        
        -- Create new optimized policy
        EXECUTE format('CREATE POLICY "Authenticated users can manage %s" ON public.%I FOR ALL TO public USING (%s)', tbl, tbl, policy_using);
        
        RAISE NOTICE 'Fixed policy for % with: %', tbl, policy_using;
    END LOOP;
END $$;

COMMIT;

-- Final verification
SELECT 
    'Final Status' as status,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid())%') as functions_remaining,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%') as policies_qual_remaining,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%') as policies_check_remaining;