-- Check which tables contain data and if they are properly secured
-- This is critical for multi-tenant data isolation

-- Create a temporary function to count rows dynamically
CREATE OR REPLACE FUNCTION count_table_rows(table_name text) 
RETURNS bigint AS $$
DECLARE
    row_count bigint;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
    RETURN row_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN -1; -- Return -1 if we can't count (permissions issue)
END;
$$ LANGUAGE plpgsql;

-- Main security check for tables with data
WITH table_info AS (
    SELECT 
        t.tablename,
        count_table_rows(t.tablename) as row_count,
        t.rowsecurity as rls_enabled,
        EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        ) as has_tenant_id_column,
        COUNT(p.policyname) as policy_count,
        STRING_AGG(p.policyname || ' (' || p.cmd || ')', ', ' ORDER BY p.policyname) as policies
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
    GROUP BY t.tablename, t.rowsecurity
)
SELECT 
    tablename,
    row_count,
    CASE 
        WHEN row_count = 0 THEN '📭 Empty'
        WHEN row_count > 0 THEN '📊 ' || row_count || ' rows'
        ELSE '❓ Unknown'
    END as data_status,
    CASE 
        WHEN row_count = 0 THEN '✅ No data to protect'
        WHEN row_count > 0 AND NOT rls_enabled THEN '🚨 CRITICAL: Data NOT protected by RLS!'
        WHEN row_count > 0 AND rls_enabled AND policy_count = 0 THEN '🚨 CRITICAL: RLS enabled but NO policies (table blocked)!'
        WHEN row_count > 0 AND rls_enabled AND has_tenant_id_column AND policy_count > 0 THEN '✅ Protected with ' || policy_count || ' policies'
        WHEN row_count > 0 AND rls_enabled AND NOT has_tenant_id_column AND policy_count > 0 THEN '⚠️  Protected but no tenant_id column'
        ELSE '❓ Check manually'
    END as security_status,
    rls_enabled,
    has_tenant_id_column,
    policy_count,
    policies
FROM table_info
WHERE tablename NOT IN ('schema_migrations', 'migrations') -- Exclude migration tables
ORDER BY 
    -- First show tables with data and no protection
    CASE 
        WHEN row_count > 0 AND NOT rls_enabled THEN 1
        WHEN row_count > 0 AND rls_enabled AND policy_count = 0 THEN 2
        WHEN row_count > 0 THEN 3
        ELSE 4
    END,
    row_count DESC,
    tablename;

-- Summary of critical issues
SELECT 
    '=== SECURITY SUMMARY ===' as report;

SELECT 
    'Tables with data but NO RLS' as issue_type,
    COUNT(*) as count,
    STRING_AGG(tablename || ' (' || count_table_rows(tablename) || ' rows)', ', ') as affected_tables
FROM pg_tables t
WHERE schemaname = 'public'
    AND (rowsecurity = false OR rowsecurity IS NULL)
    AND count_table_rows(tablename) > 0
    AND tablename NOT IN ('schema_migrations', 'migrations');

SELECT 
    'Tables with data, RLS enabled but NO policies' as issue_type,
    COUNT(*) as count,
    STRING_AGG(t.tablename || ' (' || count_table_rows(t.tablename) || ' rows)', ', ') as affected_tables
FROM pg_tables t
WHERE schemaname = 'public'
    AND rowsecurity = true
    AND count_table_rows(t.tablename) > 0
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.tablename = t.tablename 
        AND p.schemaname = t.schemaname
    );

-- Check specific high-risk tables
SELECT 
    '=== HIGH RISK BUSINESS TABLES ===' as report;

SELECT 
    tablename,
    count_table_rows(tablename) as rows,
    rowsecurity as rls_enabled,
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t.tablename) as has_policies,
    CASE 
        WHEN count_table_rows(tablename) = 0 THEN '✅ No data yet'
        WHEN NOT rowsecurity THEN '🚨 NO RLS PROTECTION!'
        WHEN rowsecurity AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t.tablename) THEN '🚨 RLS ON BUT NO POLICIES!'
        ELSE '✅ Protected'
    END as status
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN (
        -- Critical business data tables
        'leads', 'contacts', 'customers', 'invoices', 'quotes',
        'campaigns', 'appointments', 'deals', 'activities',
        'email_logs', 'sms_logs', 'call_logs', 'tasks',
        'products', 'orders', 'payments', 'expenses'
    )
ORDER BY 
    CASE 
        WHEN count_table_rows(tablename) > 0 AND NOT rowsecurity THEN 1
        WHEN count_table_rows(tablename) > 0 AND rowsecurity AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t.tablename) THEN 2
        ELSE 3
    END,
    tablename;

-- Clean up
DROP FUNCTION IF EXISTS count_table_rows(text);