-- Final Multi-Tenant Security Verification
-- This confirms that the SaaS application is now properly secured

-- ========================================
-- 1. Count tables without tenant_id (should be 0 for business tables)
-- ========================================
SELECT 
    '=== FINAL SECURITY STATUS ===' as section;

WITH security_check AS (
    SELECT 
        -- Count business tables without tenant_id
        (SELECT COUNT(*) 
         FROM information_schema.tables t
         WHERE t.table_schema = 'public'
         AND t.table_type = 'BASE TABLE'
         AND t.table_name NOT IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members')
         AND t.table_name NOT LIKE '%_config'
         AND NOT EXISTS (
             SELECT 1 FROM information_schema.columns c 
             WHERE c.table_schema = t.table_schema 
             AND c.table_name = t.table_name 
             AND c.column_name = 'tenant_id'
         )) as tables_without_tenant_id,
         
        -- Count tables without RLS
        (SELECT COUNT(*) 
         FROM pg_tables 
         WHERE schemaname = 'public' 
         AND rowsecurity = false) as tables_without_rls,
         
        -- Count tables with tenant_id but no policies
        (SELECT COUNT(DISTINCT t.table_name)
         FROM information_schema.tables t
         WHERE t.table_schema = 'public'
         AND EXISTS (
             SELECT 1 FROM information_schema.columns c 
             WHERE c.table_schema = t.table_schema 
             AND c.table_name = t.table_name 
             AND c.column_name = 'tenant_id'
         )
         AND NOT EXISTS (
             SELECT 1 FROM pg_policies p 
             WHERE p.tablename = t.table_name 
             AND p.schemaname = 'public'
         )) as tables_with_tenant_id_but_no_policies
)
SELECT 
    'Business tables without tenant_id' as metric,
    tables_without_tenant_id as count,
    CASE 
        WHEN tables_without_tenant_id = 0 THEN '✅ SECURE - All business tables have tenant isolation'
        ELSE '❌ INSECURE - ' || tables_without_tenant_id || ' tables need tenant_id'
    END as status
FROM security_check
UNION ALL
SELECT 
    'Tables without RLS enabled' as metric,
    tables_without_rls as count,
    CASE 
        WHEN tables_without_rls = 0 THEN '✅ SECURE - All tables have RLS enabled'
        ELSE '❌ INSECURE - ' || tables_without_rls || ' tables need RLS'
    END as status
FROM security_check
UNION ALL
SELECT 
    'Tables with tenant_id but no policies' as metric,
    tables_with_tenant_id_but_no_policies as count,
    CASE 
        WHEN tables_with_tenant_id_but_no_policies = 0 THEN '✅ SECURE - All tenant tables have policies'
        ELSE '⚠️ WARNING - ' || tables_with_tenant_id_but_no_policies || ' tables need policy review'
    END as status
FROM security_check;

-- ========================================
-- 2. Test tenant isolation (critical test)
-- ========================================
SELECT 
    '=== TENANT ISOLATION TEST ===' as section;

-- Check if policies properly filter by tenant_id
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual::text LIKE '%tenant_id%get_user_tenant_id%' THEN '✅ Proper tenant isolation'
        WHEN qual::text LIKE '%tenant_id%' THEN '⚠️ Uses tenant_id but check implementation'
        WHEN tablename IN ('profiles', 'tenants', 'super_admins') THEN '✅ OK - Management table'
        ELSE '❌ NO TENANT ISOLATION!'
    END as isolation_status,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    SELECT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'tenant_id'
)
ORDER BY 
    CASE 
        WHEN qual::text LIKE '%tenant_id%get_user_tenant_id%' THEN 1
        WHEN qual::text LIKE '%tenant_id%' THEN 2
        ELSE 3
    END,
    tablename, policyname
LIMIT 20;

-- ========================================
-- 3. Overall Security Score
-- ========================================
SELECT 
    '=== SECURITY SCORE ===' as section;

WITH scores AS (
    SELECT 
        CASE 
            WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) = 0 
            THEN 100 
            ELSE 0 
        END as rls_score,
        
        CASE 
            WHEN (SELECT COUNT(*) 
                  FROM information_schema.tables t
                  WHERE t.table_schema = 'public'
                  AND t.table_type = 'BASE TABLE'
                  AND t.table_name NOT IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members')
                  AND t.table_name NOT LIKE '%_config'
                  AND NOT EXISTS (
                      SELECT 1 FROM information_schema.columns c 
                      WHERE c.table_schema = t.table_schema 
                      AND c.table_name = t.table_name 
                      AND c.column_name = 'tenant_id'
                  )) = 0 
            THEN 100 
            ELSE 0 
        END as tenant_id_score,
        
        CASE 
            WHEN (SELECT COUNT(*) 
                  FROM pg_policies 
                  WHERE schemaname = 'public' 
                  AND qual::text LIKE '%tenant_id%get_user_tenant_id%') > 30
            THEN 100 
            ELSE 50
        END as policy_score
)
SELECT 
    'Multi-Tenant Security Score' as assessment,
    ROUND((rls_score + tenant_id_score + policy_score) / 3.0) || '%' as score,
    CASE 
        WHEN (rls_score + tenant_id_score + policy_score) / 3.0 >= 95 THEN '🛡️ PRODUCTION READY - Excellent multi-tenant isolation'
        WHEN (rls_score + tenant_id_score + policy_score) / 3.0 >= 80 THEN '✅ GOOD - Minor improvements recommended'
        WHEN (rls_score + tenant_id_score + policy_score) / 3.0 >= 60 THEN '⚠️ NEEDS WORK - Security gaps exist'
        ELSE '❌ NOT SECURE - Critical issues found'
    END as status,
    'RLS: ' || rls_score || '% | Tenant IDs: ' || tenant_id_score || '% | Policies: ' || policy_score || '%' as breakdown
FROM scores;