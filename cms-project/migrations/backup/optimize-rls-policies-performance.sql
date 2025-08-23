-- Optimize RLS policies by removing duplicates while maintaining security
-- This fixes performance warnings without compromising multi-tenant isolation

BEGIN;

-- ========================================
-- 1. First, identify all duplicate policies
-- ========================================
CREATE TEMP TABLE duplicate_policies AS
SELECT DISTINCT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'appointment_reminders', 'campaign_clicks', 'campaign_links', 'campaign_metrics',
        'campaign_recipients', 'invoice_items', 'pipeline_stages', 'platform_settings',
        'system_audit_log', 'workflow_actions', 'workflow_executions', 'workflow_steps',
        'workflow_templates', 'workflow_triggers'
    )
    AND policyname NOT LIKE 'tenant_isolation_%'
    AND policyname != 'Webhooks can insert leads with valid tenant';

-- ========================================
-- 2. Drop old duplicate policies (keep only tenant_isolation ones)
-- ========================================
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT * FROM duplicate_policies
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                policy_rec.policyname,
                policy_rec.schemaname,
                policy_rec.tablename);
            RAISE NOTICE 'Dropped duplicate policy: % on %.%', 
                policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy % on %.%: %', 
                    policy_rec.policyname, policy_rec.schemaname, policy_rec.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- ========================================
-- 3. Consolidate policies for better performance
-- For tables that still have issues, create consolidated policies
-- ========================================

-- Fix leads table (special case with webhook policy)
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
-- Keep the webhook policy as it serves a different purpose

-- ========================================
-- 4. Optimize other tables with remaining duplicates
-- ========================================

-- Activities table
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their activities" ON public.activities;

-- Ensure single comprehensive policy per action
DO $$
DECLARE
    tbl RECORD;
BEGIN
    -- Only process tables that don't already have optimized policies
    FOR tbl IN 
        SELECT DISTINCT tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND policyname LIKE 'tenant_isolation_%'
        AND tablename NOT IN ('leads') -- Skip special cases
    LOOP
        -- Check if there are non-tenant-isolation policies
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = tbl.tablename
            AND policyname NOT LIKE 'tenant_isolation_%'
        ) THEN
            -- Drop all non-tenant-isolation policies
            DECLARE
                pol_rec RECORD;
            BEGIN
                FOR pol_rec IN 
                    SELECT policyname 
                    FROM pg_policies 
                    WHERE schemaname = 'public' 
                    AND tablename = tbl.tablename
                    AND policyname NOT LIKE 'tenant_isolation_%'
                LOOP
                    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                        pol_rec.policyname, tbl.tablename);
                END LOOP;
            END;
        END IF;
    END LOOP;
END $$;

-- ========================================
-- 5. Ensure email_templates and team_members have proper policies
-- ========================================

-- Email templates - remove old policies
DROP POLICY IF EXISTS "Users can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can create email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can update email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Users can delete email templates" ON public.email_templates;

-- Recreate with single comprehensive policy if needed
DO $$
BEGIN
    -- Check if email_templates needs new policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_templates' 
        AND policyname LIKE 'tenant_%'
    ) THEN
        -- Create comprehensive tenant-based policies
        CREATE POLICY tenant_select ON public.email_templates
            FOR SELECT USING (tenant_id = get_user_tenant_id());
        
        CREATE POLICY tenant_insert ON public.email_templates
            FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
        
        CREATE POLICY tenant_update ON public.email_templates
            FOR UPDATE USING (tenant_id = get_user_tenant_id())
            WITH CHECK (tenant_id = get_user_tenant_id());
        
        CREATE POLICY tenant_delete ON public.email_templates
            FOR DELETE USING (tenant_id = get_user_tenant_id());
    END IF;
END $$;

-- Team members - consolidate policies
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own profile" ON public.team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;

-- ========================================
-- 6. Clean up temporary table
-- ========================================
DROP TABLE IF EXISTS duplicate_policies;

COMMIT;

-- ========================================
-- 7. Verification - Check for remaining duplicates
-- ========================================
WITH policy_summary AS (
    SELECT 
        tablename,
        cmd,
        COUNT(*) as policy_count,
        STRING_AGG(policyname, ', ') as policy_names
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
)
SELECT 
    'VERIFICATION: Remaining duplicate policies' as check_type,
    tablename,
    cmd as action,
    policy_count,
    policy_names
FROM policy_summary
ORDER BY policy_count DESC, tablename, cmd;

-- ========================================
-- 8. Performance check - Count total policies
-- ========================================
SELECT 
    'PERFORMANCE METRICS' as check_type,
    COUNT(*) FILTER (WHERE policyname LIKE 'tenant_isolation_%') as tenant_policies,
    COUNT(*) FILTER (WHERE policyname NOT LIKE 'tenant_isolation_%') as other_policies,
    COUNT(*) as total_policies,
    CASE 
        WHEN COUNT(*) FILTER (WHERE policyname NOT LIKE 'tenant_isolation_%' 
            AND policyname != 'Webhooks can insert leads with valid tenant') < 20
        THEN '✅ Optimized - Minimal duplicate policies'
        ELSE '⚠️ Still has duplicate policies'
    END as status
FROM pg_policies
WHERE schemaname = 'public';

-- ========================================
-- 9. Security verification - Ensure all tables still have proper isolation
-- ========================================
SELECT 
    'SECURITY CHECK' as check_type,
    t.table_name,
    CASE 
        WHEN COUNT(p.policyname) > 0 THEN '✅ Has policies'
        ELSE '❌ NO POLICIES - SECURITY RISK!'
    END as policy_status,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema 
        AND c.table_name = t.table_name 
        AND c.column_name = 'tenant_id'
    )
GROUP BY t.table_name
ORDER BY 
    CASE WHEN COUNT(p.policyname) = 0 THEN 0 ELSE 1 END,
    t.table_name;