-- Minimal Security Fix - Only Critical Issues
-- Run this if you have limited permissions

-- ========================================
-- 1. Fix Function Search Paths (Critical)
-- ========================================

-- List of functions that need search_path fix
-- Run these one by one if the batch fails

ALTER FUNCTION public.generate_recurring_appointments() SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_super_admin_user() SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_tenant_for_user(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_automation_rules_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_default_automation_rules(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_tenant_rls_policies(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.calculate_invoice_totals() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_invoice_totals() SET search_path = public, pg_catalog;
ALTER FUNCTION public.generate_invoice_number(uuid, text) SET search_path = public, pg_catalog;

-- ========================================
-- 2. Enable RLS on Critical Tables
-- ========================================

-- These tables should have RLS but currently don't
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. Quick Verification
-- ========================================

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'leads', 'appointments', 'automation_rules', 'automation_executions',
    'workflows', 'workflow_actions', 'workflow_executions', 'workflow_triggers',
    'campaign_recipients', 'campaign_links', 'campaign_clicks',
    'pipeline_stages', 'profiles', 'tenant_users', 'system_audit_log',
    'super_admins', 'platform_settings', 'message_outbox', 'workflow_templates'
)
ORDER BY tablename;

-- Check function search paths
SELECT 
    proname as function_name,
    proconfig
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'generate_recurring_appointments',
    'set_updated_at',
    'update_updated_at_column',
    'create_super_admin_user',
    'create_tenant_for_user',
    'update_automation_rules_updated_at',
    'create_default_automation_rules',
    'create_tenant_rls_policies',
    'calculate_invoice_totals',
    'update_invoice_totals',
    'generate_invoice_number'
);

-- ========================================
-- 4. Next Steps
-- ========================================
-- After running this script:
-- 1. The basic security issues are fixed
-- 2. RLS is enabled but policies need to be created
-- 3. You should still improve the RLS policies when possible
-- 
-- To create proper RLS policies, see the full migration scripts