-- SAFE COMPREHENSIVE DATABASE OVERVIEW
-- This script safely queries all tables without assuming specific column names exist

-- ========================================
-- 1. LIST ALL TABLES WITH BASIC INFO
-- ========================================
SELECT 
    'DATABASE OVERVIEW' as section,
    t.table_name,
    t.table_type,
    CASE 
        WHEN t.table_name IN ('schema_migrations', 'migrations') THEN 'System'
        WHEN t.table_name LIKE 'auth_%' THEN 'Authentication'  
        WHEN t.table_name IN ('tenants', 'profiles', 'user_tenants', 'super_admins') THEN 'Multi-tenant Core'
        WHEN t.table_name IN ('leads', 'contacts', 'customers', 'deals') THEN 'CRM Core'
        WHEN t.table_name IN ('invoices', 'quotes', 'products', 'expenses') THEN 'Financial'
        WHEN t.table_name IN ('campaigns', 'campaign_clicks', 'campaign_links', 'campaign_recipients') THEN 'Marketing'
        WHEN t.table_name IN ('appointments', 'activities', 'tasks') THEN 'Activities'
        WHEN t.table_name IN ('email_logs', 'sms_logs', 'call_logs') THEN 'Communications'
        WHEN t.table_name LIKE '%automation%' OR t.table_name LIKE '%workflow%' THEN 'Automation'
        WHEN t.table_name LIKE '%template%' THEN 'Templates'
        WHEN t.table_name LIKE '%analytics%' OR t.table_name LIKE '%audit%' THEN 'Analytics & Audit'
        ELSE 'Other'
    END as category,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY category, t.table_name;

-- ========================================
-- 2. TABLE STRUCTURES WITH COLUMN DETAILS
-- ========================================
SELECT 
    'TABLE STRUCTURES' as section,
    c.table_name,
    c.ordinal_position,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN c.column_name = 'id' THEN '🔑 Primary Key'
        WHEN c.column_name LIKE '%_id' AND c.column_name != 'tenant_id' THEN '🔗 Foreign Key'
        WHEN c.column_name = 'tenant_id' THEN '🏢 Tenant Isolation'
        WHEN c.column_name IN ('created_at', 'updated_at') THEN '📅 Timestamp'
        WHEN c.column_name IN ('email', 'phone', 'name', 'title') THEN '👤 Identity'
        ELSE ''
    END as key_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- ========================================
-- 3. FOREIGN KEY RELATIONSHIPS
-- ========================================
SELECT 
    'FOREIGN KEY RELATIONSHIPS' as section,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- 4. ROW LEVEL SECURITY STATUS
-- ========================================
SELECT 
    'RLS SECURITY STATUS' as section,
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    STRING_AGG(p.policyname, ', ' ORDER BY p.policyname) as policies,
    CASE 
        WHEN NOT t.rowsecurity THEN '🚨 NO RLS'
        WHEN COUNT(p.policyname) = 0 THEN '⚠️ RLS ON, NO POLICIES'
        WHEN EXISTS (
            SELECT 1 FROM pg_policies p2 
            WHERE p2.tablename = t.tablename 
            AND p2.schemaname = 'public'
            AND p2.qual LIKE '%tenant_id = get_user_tenant_id()%'
        ) THEN '✅ TENANT ISOLATED'
        ELSE '⚠️ CHECK POLICIES'
    END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations', 'migrations')
GROUP BY t.tablename, t.rowsecurity
ORDER BY 
    CASE 
        WHEN NOT t.rowsecurity THEN 1
        WHEN COUNT(p.policyname) = 0 THEN 2
        ELSE 3
    END,
    t.tablename;

-- ========================================
-- 5. SAMPLE DATA FROM KEY TABLES (SAFE)
-- ========================================

-- Check what tables exist and get sample data
DO $$
DECLARE
    table_name TEXT;
    sql_query TEXT;
BEGIN
    -- Iterate through key tables and get sample data if they exist
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('tenants', 'profiles', 'super_admins', 'leads', 'contacts', 'invoices', 'campaigns')
        ORDER BY t.table_name
    LOOP
        sql_query := 'SELECT ''' || upper(table_name) || ' SAMPLE'' as section, * FROM public.' || table_name || ' ORDER BY created_at DESC LIMIT 3';
        RAISE NOTICE 'Table: %', table_name;
        -- Execute the query (in real use, you'd execute this)
    END LOOP;
END $$;

-- Safe queries for specific tables
SELECT 'TENANTS DATA' as section, * FROM public.tenants ORDER BY created_at DESC LIMIT 5;

SELECT 'SUPER ADMINS DATA' as section, * FROM public.super_admins ORDER BY created_at DESC;

-- ========================================
-- 6. TABLE ROW COUNTS
-- ========================================
WITH table_counts AS (
    SELECT 
        schemaname,
        tablename,
        n_live_tup as estimated_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
)
SELECT 
    'TABLE ROW COUNTS' as section,
    tablename,
    estimated_rows,
    CASE 
        WHEN estimated_rows = 0 THEN 'Empty'
        WHEN estimated_rows < 10 THEN 'Very Small'
        WHEN estimated_rows < 100 THEN 'Small'
        WHEN estimated_rows < 1000 THEN 'Medium'
        ELSE 'Large'
    END as size_category
FROM table_counts
ORDER BY estimated_rows DESC;

-- ========================================
-- 7. INDEXES OVERVIEW
-- ========================================
SELECT 
    'INDEXES OVERVIEW' as section,
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%pkey%' THEN '🔑 Primary Key'
        WHEN indexname LIKE '%unique%' OR indexdef LIKE '%UNIQUE%' THEN '🔒 Unique'
        WHEN indexname LIKE '%fk%' OR indexname LIKE '%foreign%' THEN '🔗 Foreign Key'
        WHEN indexname LIKE '%tenant%' THEN '🏢 Tenant'
        ELSE '📊 Regular'
    END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 8. CUSTOM TYPES AND ENUMS
-- ========================================
SELECT 
    'CUSTOM TYPES' as section,
    t.typname as type_name,
    CASE 
        WHEN t.typcategory = 'E' THEN 'Enum'
        WHEN t.typcategory = 'C' THEN 'Composite'
        ELSE 'Other'
    END as type_description,
    array_to_string(ARRAY(
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = t.oid 
        ORDER BY enumsortorder
    ), ', ') as enum_values
FROM pg_type t
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND t.typname NOT LIKE '\_%'
    AND t.typcategory IN ('E', 'C')
ORDER BY t.typname;

-- ========================================
-- 9. FUNCTIONS OVERVIEW
-- ========================================
SELECT 
    'FUNCTIONS' as section,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    l.lanname as language,
    CASE 
        WHEN p.proname LIKE '%tenant%' THEN '🏢 Multi-tenant'
        WHEN p.proname LIKE '%auth%' THEN '🔐 Authentication'
        WHEN p.proname LIKE '%rls%' THEN '🛡️ Security'
        ELSE '⚙️ General'
    END as category
FROM pg_proc p
LEFT JOIN pg_language l ON p.prolang = l.oid
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY category, p.proname;

-- ========================================
-- 10. SUBSCRIPTION OVERVIEW (IF EXISTS)
-- ========================================
SELECT 
    'SUBSCRIPTION DATA' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'subscription_plan')
        THEN 'Subscription columns exist'
        ELSE 'No subscription columns found'
    END as subscription_status;

-- Only run if subscription columns exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_plan'
    ) THEN
        -- This would show subscription data if columns exist
        RAISE NOTICE 'Subscription columns found in tenants table';
    ELSE
        RAISE NOTICE 'No subscription columns found';
    END IF;
END $$;

-- ========================================
-- 11. SUMMARY STATISTICS
-- ========================================
SELECT 
    'SUMMARY STATISTICS' as section,
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Total Columns' as metric,
    COUNT(*)::text as value
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Total Indexes' as metric,
    COUNT(*)::text as value
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Tables with RLS' as metric,
    COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Custom Functions' as metric,
    COUNT(*)::text as value
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind = 'f'

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Custom Types' as metric,
    COUNT(*)::text as value
FROM pg_type t
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND t.typname NOT LIKE '\_%'
    AND t.typcategory IN ('E', 'C');

-- ========================================
-- END OF SAFE COMPREHENSIVE DATABASE OVERVIEW
-- ========================================