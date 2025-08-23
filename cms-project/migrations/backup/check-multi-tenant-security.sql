-- Comprehensive multi-tenant security check for the SaaS application
-- This checks if all tables have proper tenant isolation

-- ========================================
-- 1. Check which tables have tenant_id columns
-- ========================================
SELECT 
    '=== TABLES WITH TENANT_ID ===' as section;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
ORDER BY table_name;

-- ========================================
-- 2. Check which tables DON'T have tenant_id (potential security risk)
-- ========================================
SELECT 
    '=== TABLES WITHOUT TENANT_ID (CHECK IF NEEDED) ===' as section;

SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members') 
            THEN '✅ OK - User/Tenant management table'
        WHEN t.table_name LIKE '%_config' OR t.table_name LIKE 'config_%' 
            THEN '✅ OK - Configuration table'
        WHEN t.table_name = 'system_audit_log' 
            THEN '⚠️ CHECK - May need tenant_id for isolation'
        ELSE '❌ NEEDS REVIEW - Business data without tenant isolation'
    END as status,
    CASE 
        WHEN t.table_name IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members') THEN 1
        WHEN t.table_name LIKE '%_config' OR t.table_name LIKE 'config_%' THEN 2
        ELSE 3
    END as sort_order
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema 
        AND c.table_name = t.table_name 
        AND c.column_name = 'tenant_id'
    )
ORDER BY sort_order, t.table_name;

-- ========================================
-- 3. Check RLS (Row Level Security) status on all tables
-- ========================================
SELECT 
    '=== RLS STATUS BY TABLE ===' as section;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED - SECURITY RISK!'
    END as rls_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = schemaname 
            AND table_name = tablename 
            AND column_name = 'tenant_id'
        ) THEN 'Has tenant_id'
        ELSE 'No tenant_id'
    END as tenant_column
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY 
    CASE WHEN rowsecurity = false THEN 0 ELSE 1 END,
    tablename;

-- ========================================
-- 4. Check RLS policies for proper tenant isolation
-- ========================================
SELECT 
    '=== RLS POLICIES CHECK ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    CASE 
        WHEN qual::text LIKE '%tenant_id%' THEN '✅ Uses tenant_id'
        WHEN qual::text LIKE '%auth.uid()%' THEN '⚠️ Uses auth.uid() - check if sufficient'
        ELSE '❌ NO TENANT CHECK - SECURITY RISK!'
    END as tenant_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 5. Check for functions that might bypass tenant isolation
-- ========================================
SELECT 
    '=== FUNCTIONS SECURITY CHECK ===' as section;

SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    CASE 
        WHEN p.prosecdef = true THEN '⚠️ SECURITY DEFINER - Can bypass RLS'
        ELSE '✅ INVOKER security'
    END as security_status,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY 
    CASE WHEN p.prosecdef = true THEN 0 ELSE 1 END,
    p.proname;

-- ========================================
-- 6. Summary and recommendations
-- ========================================
SELECT 
    '=== MULTI-TENANT SECURITY SUMMARY ===' as section;

WITH security_summary AS (
    SELECT 
        COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls,
        COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_type = 'BASE TABLE'
         AND table_name NOT IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members')
         AND NOT EXISTS (
             SELECT 1 FROM information_schema.columns c 
             WHERE c.table_schema = 'public' 
             AND c.table_name = tables.table_name 
             AND c.column_name = 'tenant_id'
         )) as business_tables_without_tenant_id
    FROM pg_tables
    WHERE schemaname = 'public'
)
SELECT 
    tables_without_rls || ' tables without RLS' as issue,
    CASE 
        WHEN tables_without_rls > 0 THEN '❌ CRITICAL - Enable RLS on all tables'
        ELSE '✅ All tables have RLS'
    END as status
FROM security_summary
UNION ALL
SELECT 
    business_tables_without_tenant_id || ' business tables without tenant_id' as issue,
    CASE 
        WHEN business_tables_without_tenant_id > 0 THEN '❌ CRITICAL - Add tenant_id to business tables'
        ELSE '✅ All business tables have tenant_id'
    END as status
FROM security_summary;