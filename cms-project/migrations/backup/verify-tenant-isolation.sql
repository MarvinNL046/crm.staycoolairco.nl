-- Comprehensive tenant isolation verification script
-- This script checks if multi-tenant data isolation is properly implemented

-- ========================================
-- 1. Check RLS status on all tables
-- ========================================
SELECT 
    'RLS Status Overview' as check_type,
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls_enabled,
    COUNT(*) FILTER (WHERE rowsecurity = false OR rowsecurity IS NULL) as tables_without_rls,
    COUNT(*) as total_tables
FROM pg_tables
WHERE schemaname = 'public';

-- List tables WITHOUT RLS that might contain sensitive data
SELECT 
    'CRITICAL: Tables without RLS' as warning,
    tablename,
    CASE 
        WHEN tablename IN ('leads', 'contacts', 'customers', 'invoices', 'campaigns', 'appointments') 
        THEN '🚨 HIGH RISK - Contains customer data!'
        WHEN tablename LIKE '%_log%' OR tablename LIKE '%_logs%'
        THEN '⚠️  MEDIUM RISK - Contains activity logs'
        ELSE 'ℹ️  Check if contains tenant data'
    END as risk_level
FROM pg_tables
WHERE schemaname = 'public'
    AND (rowsecurity = false OR rowsecurity IS NULL)
ORDER BY 
    CASE 
        WHEN tablename IN ('leads', 'contacts', 'customers', 'invoices', 'campaigns', 'appointments') THEN 1
        WHEN tablename LIKE '%_log%' OR tablename LIKE '%_logs%' THEN 2
        ELSE 3
    END,
    tablename;

-- ========================================
-- 2. Check if tables with RLS have proper policies
-- ========================================
SELECT 
    'Tables with RLS but insufficient policies' as check_type,
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) = 0 THEN '🚨 NO POLICIES - Table is completely blocked!'
        WHEN COUNT(p.policyname) < 2 THEN '⚠️  Only ' || COUNT(p.policyname) || ' policy - might be read-only'
        ELSE '✅ Has ' || COUNT(p.policyname) || ' policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY COUNT(p.policyname), t.tablename;

-- ========================================
-- 3. Verify tenant isolation in policies
-- ========================================
SELECT 
    'Policy Tenant Isolation Check' as check_type,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual LIKE '%tenant_id = get_user_tenant_id()%' THEN '✅ Proper tenant isolation'
        WHEN qual LIKE '%tenant_id%' THEN '⚠️  Has tenant check but different pattern'
        WHEN qual LIKE '%auth.uid()%' THEN 'ℹ️  User-based isolation'
        WHEN qual LIKE '%super_admin%' THEN '🔒 Super admin only'
        WHEN qual = 'true' THEN '🚨 NO ISOLATION - Anyone can access!'
        ELSE '❓ Custom logic - needs review'
    END as isolation_status,
    qual as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        SELECT tablename 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name = 'tenant_id'
    )
ORDER BY 
    CASE 
        WHEN qual = 'true' THEN 1
        WHEN qual NOT LIKE '%tenant_id%' THEN 2
        ELSE 3
    END,
    tablename, policyname;

-- ========================================
-- 4. Check critical business tables specifically
-- ========================================
SELECT 
    'Critical Business Tables Security Check' as check_type,
    t.tablename,
    t.rowsecurity as rls_enabled,
    EXISTS (
        SELECT 1 FROM information_schema.columns c 
        WHERE c.table_schema = 'public' 
        AND c.table_name = t.tablename 
        AND c.column_name = 'tenant_id'
    ) as has_tenant_id,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = false THEN '🚨 CRITICAL: No RLS!'
        WHEN COUNT(p.policyname) = 0 THEN '🚨 CRITICAL: RLS enabled but no policies!'
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_policies p2 
            WHERE p2.tablename = t.tablename 
            AND p2.qual LIKE '%tenant_id%'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        ) THEN '🚨 CRITICAL: Has tenant_id but no tenant isolation!'
        ELSE '✅ Secured'
    END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'leads', 'contacts', 'customers', 'invoices', 'campaigns', 
        'appointments', 'deals', 'quotes', 'orders', 'products',
        'activities', 'tasks', 'email_logs', 'sms_logs'
    )
GROUP BY t.tablename, t.rowsecurity
ORDER BY 
    CASE 
        WHEN t.rowsecurity = false THEN 1
        WHEN COUNT(p.policyname) = 0 THEN 2
        ELSE 3
    END,
    t.tablename;

-- ========================================
-- 5. Find tables that should have tenant_id but don't
-- ========================================
SELECT 
    'Tables possibly missing tenant_id column' as check_type,
    t.tablename,
    CASE 
        WHEN t.tablename LIKE '%tenant%' THEN 'Tenant management table'
        WHEN t.tablename IN ('super_admins', 'platform_settings') THEN 'Platform-wide table'
        WHEN t.tablename LIKE '%_log' OR t.tablename LIKE '%_logs' THEN 'Logging table - check if needs tenant isolation'
        ELSE '⚠️  Should this have tenant_id?'
    END as assessment
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c 
        WHERE c.table_schema = 'public' 
        AND c.table_name = t.tablename 
        AND c.column_name = 'tenant_id'
    )
    AND t.tablename NOT IN (
        -- Known tables that don't need tenant_id
        'schema_migrations', 'ar_internal_metadata', 
        'super_admins', 'platform_settings', 'tenants'
    )
ORDER BY 
    CASE 
        WHEN t.tablename LIKE '%_log' OR t.tablename LIKE '%_logs' THEN 2
        ELSE 1
    END,
    t.tablename;

-- ========================================
-- 6. Test the get_user_tenant_id() function
-- ========================================
SELECT 
    'get_user_tenant_id() function check' as check_type,
    EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_user_tenant_id'
    ) as function_exists,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'get_user_tenant_id'
            AND p.prosrc LIKE '%(SELECT auth.uid())%'
        ) THEN '✅ Function uses optimized auth.uid()'
        ELSE '⚠️  Check function implementation'
    END as implementation_status;

-- ========================================
-- 7. Summary Report
-- ========================================
SELECT 
    'TENANT ISOLATION SUMMARY' as report,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND (rowsecurity = false OR rowsecurity IS NULL)) as tables_without_rls,
    (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%tenant_id = get_user_tenant_id()%') as tables_with_proper_tenant_isolation,
    (SELECT COUNT(*) FROM pg_tables t WHERE schemaname = 'public' AND rowsecurity = true AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)) as tables_with_rls_but_no_policies;

-- ========================================
-- 8. Dangerous policies check
-- ========================================
SELECT 
    'DANGEROUS POLICIES - Need immediate attention!' as warning,
    tablename,
    policyname,
    cmd,
    qual,
    CASE 
        WHEN qual = 'true' THEN '🚨 ALLOWS EVERYONE!'
        WHEN qual NOT LIKE '%tenant_id%' AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tablename 
            AND column_name = 'tenant_id'
        ) THEN '🚨 NO TENANT CHECK!'
        ELSE 'Check this policy'
    END as risk
FROM pg_policies
WHERE schemaname = 'public'
    AND (
        qual = 'true' 
        OR (
            qual NOT LIKE '%tenant_id%' 
            AND tablename IN (
                SELECT table_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND column_name = 'tenant_id'
            )
        )
    )
ORDER BY tablename, policyname;