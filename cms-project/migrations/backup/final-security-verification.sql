-- FINAL SECURITY VERIFICATION
-- Comprehensive check to ensure all tenant data is properly isolated

-- ========================================
-- 1. CRITICAL: Any policies still allowing everyone?
-- ========================================
SELECT 
    '🚨 CRITICAL: Policies allowing EVERYONE' as alert,
    tablename,
    policyname,
    cmd,
    'This policy allows ANY authenticated user to access this data!' as risk
FROM pg_policies
WHERE schemaname = 'public'
    AND qual = 'true'
ORDER BY tablename, policyname;

-- ========================================  
-- 2. HIGH RISK: Tables with data but no tenant isolation
-- ========================================
WITH table_data_check AS (
    SELECT 
        t.tablename,
        t.rowsecurity as rls_enabled,
        EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        ) as has_tenant_id,
        COUNT(p.policyname) as policy_count,
        -- Check if any policies have tenant isolation
        EXISTS (
            SELECT 1 FROM pg_policies p2 
            WHERE p2.tablename = t.tablename 
            AND p2.schemaname = 'public'
            AND p2.qual LIKE '%tenant_id = get_user_tenant_id()%'
        ) as has_tenant_isolation
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
        AND t.tablename IN (
            -- Only check tables that likely contain business data
            'leads', 'contacts', 'customers', 'invoices', 'campaigns', 
            'appointments', 'deals', 'quotes', 'products', 'orders',
            'activities', 'tasks', 'email_logs', 'sms_logs', 'call_logs',
            'expenses', 'analytics_events', 'automations', 'deals'
        )
    GROUP BY t.tablename, t.rowsecurity
)
SELECT 
    '⚠️  HIGH RISK: Tables with tenant_id but no tenant isolation in policies' as warning,
    tablename,
    CASE 
        WHEN NOT rls_enabled THEN '🚨 NO RLS AT ALL!'
        WHEN policy_count = 0 THEN '🚨 NO POLICIES!'
        WHEN has_tenant_id AND NOT has_tenant_isolation THEN '🚨 NO TENANT ISOLATION IN POLICIES!'
        ELSE '✅ Properly secured'
    END as status
FROM table_data_check
WHERE (
    NOT rls_enabled 
    OR policy_count = 0 
    OR (has_tenant_id AND NOT has_tenant_isolation)
)
ORDER BY 
    CASE 
        WHEN NOT rls_enabled THEN 1
        WHEN policy_count = 0 THEN 2
        ELSE 3
    END,
    tablename;

-- ========================================
-- 3. SUMMARY: Security status overview
-- ========================================
SELECT 
    '=== SECURITY OVERVIEW ===' as report;

-- Count tables by security status
WITH security_summary AS (
    SELECT 
        t.tablename,
        t.rowsecurity as rls_enabled,
        COUNT(p.policyname) as policy_count,
        EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        ) as has_tenant_id,
        EXISTS (
            SELECT 1 FROM pg_policies p2 
            WHERE p2.tablename = t.tablename 
            AND p2.schemaname = 'public'
            AND (p2.qual LIKE '%tenant_id = get_user_tenant_id()%' 
                OR p2.qual LIKE '%auth.uid()%'
                OR p2.qual LIKE '%super_admin%')
        ) as has_proper_isolation
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
        AND t.tablename NOT IN ('schema_migrations', 'migrations')
    GROUP BY t.tablename, t.rowsecurity
)
SELECT 
    'Tables with RLS enabled' as metric,
    COUNT(*) FILTER (WHERE rls_enabled = true) as count
FROM security_summary
UNION ALL
SELECT 
    'Tables with RLS but no policies' as metric,
    COUNT(*) FILTER (WHERE rls_enabled = true AND policy_count = 0) as count
FROM security_summary
UNION ALL
SELECT 
    'Tables with proper tenant isolation' as metric,
    COUNT(*) FILTER (WHERE has_tenant_id = true AND has_proper_isolation = true) as count
FROM security_summary
UNION ALL
SELECT 
    'Tables with tenant_id but no tenant isolation' as metric,
    COUNT(*) FILTER (WHERE has_tenant_id = true AND NOT has_proper_isolation) as count
FROM security_summary;

-- ========================================
-- 4. FINAL VERDICT
-- ========================================
WITH final_check AS (
    SELECT 
        COUNT(*) FILTER (
            WHERE qual = 'true' 
            AND tablename IN (
                'leads', 'contacts', 'customers', 'invoices', 'campaigns',
                'appointments', 'deals', 'activities', 'tasks'
            )
        ) as dangerous_policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT 
    CASE 
        WHEN dangerous_policies_count = 0 THEN '✅ SECURITY STATUS: All critical business tables appear to be properly protected!'
        ELSE '🚨 SECURITY WARNING: ' || dangerous_policies_count || ' dangerous policies found on business tables!'
    END as final_verdict
FROM final_check;