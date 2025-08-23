-- Fix remaining RLS performance warnings
-- This migration addresses all auth.uid() optimization issues for the remaining tables

BEGIN;

-- 1. Fix activities table
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
CREATE POLICY "Users can create activities" ON public.activities
AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid())));

-- 2. Fix user_tenants table
DROP POLICY IF EXISTS "Users can join invited tenants" ON public.user_tenants;
CREATE POLICY "Users can join invited tenants" ON public.user_tenants
AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((user_id = (SELECT auth.uid())) AND (status = 'invited'::text));

-- 3. Fix profiles table
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
AS PERMISSIVE FOR SELECT TO public
USING ((tenant_id = get_user_tenant_id()) OR (id = (SELECT auth.uid())));

-- 4. Fix tenants table
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON public.tenants;
CREATE POLICY "Authenticated users can view tenants" ON public.tenants
AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1
  FROM user_tenants
  WHERE ((user_tenants.tenant_id = tenants.id) AND (user_tenants.user_id = (SELECT auth.uid())))
));

-- 5. Fix leads table
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
CREATE POLICY "Authenticated users can manage leads" ON public.leads
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 6. Fix contacts table
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON public.contacts;
CREATE POLICY "Authenticated users can manage contacts" ON public.contacts
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 7. Fix customers table
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Authenticated users can manage customers" ON public.customers
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 8. Fix companies table
DROP POLICY IF EXISTS "Authenticated users can manage companies" ON public.companies;
CREATE POLICY "Authenticated users can manage companies" ON public.companies
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 9. Fix invoices table
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.invoices;
CREATE POLICY "Authenticated users can manage invoices" ON public.invoices
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 10. Fix invoice_items table
DROP POLICY IF EXISTS "Authenticated users can manage invoice items" ON public.invoice_items;
CREATE POLICY "Authenticated users can manage invoice items" ON public.invoice_items
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 11. Fix appointments table
DROP POLICY IF EXISTS "Authenticated users can manage appointments" ON public.appointments;
CREATE POLICY "Authenticated users can manage appointments" ON public.appointments
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 12. Fix products table
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 13. Fix btw_percentages table
DROP POLICY IF EXISTS "Authenticated users can manage BTW percentages" ON public.btw_percentages;
CREATE POLICY "Authenticated users can manage BTW percentages" ON public.btw_percentages
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 14. Fix tags table
DROP POLICY IF EXISTS "Authenticated users can manage tags" ON public.tags;
CREATE POLICY "Authenticated users can manage tags" ON public.tags
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 15. Fix email_templates table
DROP POLICY IF EXISTS "Authenticated users can manage email templates" ON public.email_templates;
CREATE POLICY "Authenticated users can manage email templates" ON public.email_templates
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 16. Fix campaigns table
DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can manage campaigns" ON public.campaigns
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 17. Fix campaign_metrics table
DROP POLICY IF EXISTS "Authenticated users can manage campaign metrics" ON public.campaign_metrics;
CREATE POLICY "Authenticated users can manage campaign metrics" ON public.campaign_metrics
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 18. Fix pipeline_stages table
DROP POLICY IF EXISTS "Authenticated users can manage pipeline stages" ON public.pipeline_stages;
CREATE POLICY "Authenticated users can manage pipeline stages" ON public.pipeline_stages
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 19. Fix workflows table
DROP POLICY IF EXISTS "Authenticated users can manage workflows" ON public.workflows;
CREATE POLICY "Authenticated users can manage workflows" ON public.workflows
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 20. Fix workflow_templates table
DROP POLICY IF EXISTS "Authenticated users can view workflow templates" ON public.workflow_templates;
CREATE POLICY "Authenticated users can view workflow templates" ON public.workflow_templates
AS PERMISSIVE FOR SELECT TO public
USING (true);  -- Templates are public

-- 21. Fix workflow_steps table
DROP POLICY IF EXISTS "Authenticated users can manage workflow steps" ON public.workflow_steps;
CREATE POLICY "Authenticated users can manage workflow steps" ON public.workflow_steps
AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1
  FROM workflows
  WHERE ((workflows.id = workflow_steps.workflow_id) AND (workflows.tenant_id = get_user_tenant_id()))
));

-- 22. Fix workflow_executions table
DROP POLICY IF EXISTS "Authenticated users can manage workflow executions" ON public.workflow_executions;
CREATE POLICY "Authenticated users can manage workflow executions" ON public.workflow_executions
AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1
  FROM workflows
  WHERE ((workflows.id = workflow_executions.workflow_id) AND (workflows.tenant_id = get_user_tenant_id()))
));

-- 23. Fix automation_rules table
DROP POLICY IF EXISTS "Authenticated users can manage automation rules" ON public.automation_rules;
CREATE POLICY "Authenticated users can manage automation rules" ON public.automation_rules
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 24. Fix automation_logs table
DROP POLICY IF EXISTS "Authenticated users can manage automation logs" ON public.automation_logs;
CREATE POLICY "Authenticated users can manage automation logs" ON public.automation_logs
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 25. Fix api_keys table
DROP POLICY IF EXISTS "Authenticated users can manage API keys" ON public.api_keys;
CREATE POLICY "Authenticated users can manage API keys" ON public.api_keys
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 26. Fix webhook_logs table
DROP POLICY IF EXISTS "Authenticated users can manage webhook logs" ON public.webhook_logs;
CREATE POLICY "Authenticated users can manage webhook logs" ON public.webhook_logs
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 27. Fix email_logs table
DROP POLICY IF EXISTS "Authenticated users can manage email logs" ON public.email_logs;
CREATE POLICY "Authenticated users can manage email logs" ON public.email_logs
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

-- 28. Fix appointment_reminders table
DROP POLICY IF EXISTS "Authenticated users can manage appointment reminders" ON public.appointment_reminders;
CREATE POLICY "Authenticated users can manage appointment reminders" ON public.appointment_reminders
AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1
  FROM appointments
  WHERE ((appointments.id = appointment_reminders.appointment_id) AND (appointments.tenant_id = get_user_tenant_id()))
));

-- 29. Fix recurring_appointments table
DROP POLICY IF EXISTS "Authenticated users can manage recurring appointments" ON public.recurring_appointments;
CREATE POLICY "Authenticated users can manage recurring appointments" ON public.recurring_appointments
AS PERMISSIVE FOR ALL TO public
USING (tenant_id = get_user_tenant_id());

COMMIT;

-- Fix duplicate indexes
BEGIN;

-- Drop duplicate indexes on api_keys table
DROP INDEX IF EXISTS idx_api_keys_tenant;  -- Keep idx_api_keys_tenant_id

-- Drop duplicate indexes on workflow_executions table
DROP INDEX IF EXISTS idx_workflow_executions_workflow;  -- Keep idx_workflow_executions_workflow_id

COMMIT;

-- Verify the fixes
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
    'activities', 'user_tenants', 'profiles', 'tenants', 'leads', 'contacts',
    'customers', 'companies', 'invoices', 'invoice_items', 'appointments',
    'products', 'btw_percentages', 'tags', 'email_templates', 'campaigns',
    'campaign_metrics', 'pipeline_stages', 'workflows', 'workflow_templates',
    'workflow_steps', 'workflow_executions', 'automation_rules', 'automation_logs',
    'api_keys', 'webhook_logs', 'email_logs', 'appointment_reminders',
    'recurring_appointments'
  )
ORDER BY tablename, policyname;