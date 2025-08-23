-- ULTRA SAFE COMPREHENSIVE DATABASE OVERVIEW
-- This script fixes the tablename column issue and uses the most conservative approach

-- ========================================
-- 1. LIST ALL TABLES WITH CATEGORIES
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
    CASE 
        WHEN c.column_name = 'id' THEN '🔑 Primary Key'
        WHEN c.column_name LIKE '%_id' AND c.column_name != 'tenant_id' THEN '🔗 Foreign Key'
        WHEN c.column_name = 'tenant_id' THEN '🏢 Tenant Isolation'
        WHEN c.column_name IN ('created_at', 'updated_at') THEN '📅 Timestamp'
        WHEN c.column_name IN ('email', 'phone', 'name', 'title') THEN '👤 Identity'
        WHEN c.column_name LIKE 'subscription_%' THEN '💳 Subscription'
        WHEN c.column_name LIKE 'last_%' THEN '🕐 Activity'
        ELSE ''
    END as key_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- ========================================
-- 3. TABLE ROW COUNTS AND BASIC INFO (FIXED)
-- ========================================
WITH table_info AS (
    SELECT 
        schemaname,
        relname as table_name,
        n_live_tup as estimated_rows,
        n_tup_ins as total_inserts,
        n_tup_upd as total_updates,
        n_tup_del as total_deletes
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
)
SELECT 
    'TABLE DATA OVERVIEW' as section,
    table_name,
    estimated_rows,
    total_inserts + total_updates + total_deletes as total_activity,
    CASE 
        WHEN estimated_rows = 0 THEN '📭 Empty'
        WHEN estimated_rows < 10 THEN '🔢 Very Small (< 10 rows)'
        WHEN estimated_rows < 100 THEN '📊 Small (< 100 rows)'
        WHEN estimated_rows < 1000 THEN '📈 Medium (< 1K rows)'
        ELSE '📊 Large (1K+ rows)'
    END as size_category
FROM table_info
ORDER BY estimated_rows DESC, table_name;

-- ========================================
-- 4. FOREIGN KEY RELATIONSHIPS
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
-- 5. ROW LEVEL SECURITY STATUS (FIXED)
-- ========================================
SELECT 
    'RLS SECURITY STATUS' as section,
    t.tablename as table_name,
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
-- 6. SAMPLE DATA (VERY SAFE APPROACH)
-- ========================================

-- Tenants - This should always work
SELECT 'TENANTS DATA' as section, * FROM public.tenants ORDER BY created_at DESC LIMIT 3;

-- Super admins - This should always work  
SELECT 'SUPER ADMINS' as section, * FROM public.super_admins ORDER BY created_at DESC;

-- Profiles - Using only guaranteed columns
SELECT 'PROFILES DATA' as section, 
    id, 
    email, 
    tenant_id, 
    created_at
FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- Basic CRM data - only safe columns
SELECT 'LEADS BASIC DATA' as section, 
    id, 
    email, 
    tenant_id, 
    created_at
FROM public.leads ORDER BY created_at DESC LIMIT 5;

SELECT 'CONTACTS BASIC DATA' as section,
    id,
    email, 
    tenant_id,
    created_at
FROM public.contacts ORDER BY created_at DESC LIMIT 5;

-- ========================================
-- 7. SUBSCRIPTION OVERVIEW
-- ========================================
SELECT 
    'SUBSCRIPTION OVERVIEW' as section,
    t.name as tenant_name,
    COALESCE(t.subscription_plan, 'Not set') as subscription_plan,
    COALESCE(t.subscription_status, 'Not set') as subscription_status,
    COALESCE(t.monthly_price, 0) as monthly_price,
    COALESCE(t.max_users, 0) as max_users,
    COALESCE(t.max_leads, 0) as max_leads,
    t.subscription_ends_at as subscription_ends_date,
    (SELECT COUNT(*) FROM public.profiles WHERE tenant_id = t.id) as current_users,
    (SELECT COUNT(*) FROM public.leads WHERE tenant_id = t.id) as current_leads
FROM public.tenants t
ORDER BY t.created_at DESC;

-- ========================================
-- 8. USER ACTIVITY (IF COLUMNS EXIST)
-- ========================================
DO $$
DECLARE
    has_last_sign_in boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles' 
        AND column_name = 'last_sign_in_at'
    ) INTO has_last_sign_in;

    IF has_last_sign_in THEN
        RAISE NOTICE 'User activity columns found - activity tracking is available';
    ELSE
        RAISE NOTICE 'No user activity columns found - run add-useful-columns.sql first';
    END IF;
END $$;

-- ========================================
-- 9. ENUM TYPES AND VALUES
-- ========================================
SELECT 
    'ENUM TYPES' as section,
    t.typname as enum_name,
    array_to_string(ARRAY(
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = t.oid 
        ORDER BY enumsortorder
    ), ', ') as possible_values
FROM pg_type t
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND t.typcategory = 'E'
ORDER BY t.typname;

-- ========================================
-- 10. FUNCTIONS OVERVIEW
-- ========================================
SELECT 
    'CUSTOM FUNCTIONS' as section,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proname LIKE '%tenant%' THEN '🏢 Multi-tenant'
        WHEN p.proname LIKE '%auth%' OR p.proname LIKE '%sign_in%' THEN '🔐 Authentication'
        WHEN p.proname LIKE '%rls%' THEN '🛡️ Security'
        WHEN p.proname LIKE '%update%' THEN '🔄 Triggers'
        ELSE '⚙️ General'
    END as category
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY category, p.proname;

-- ========================================
-- 11. INDEXES OVERVIEW (FIXED)
-- ========================================
SELECT 
    'INDEXES OVERVIEW' as section,
    i.tablename as table_name,
    COUNT(*) as index_count,
    STRING_AGG(
        CASE 
            WHEN i.indexname LIKE '%pkey%' THEN '🔑'
            WHEN i.indexname LIKE '%unique%' THEN '🔒'
            WHEN i.indexname LIKE '%tenant%' THEN '🏢'
            ELSE '📊'
        END || ' ' || i.indexname, 
        ', ' 
        ORDER BY i.indexname
    ) as indexes
FROM pg_indexes i
WHERE i.schemaname = 'public'
GROUP BY i.tablename
ORDER BY index_count DESC, i.tablename;

-- ========================================
-- 12. SUMMARY STATISTICS
-- ========================================
SELECT 
    'SUMMARY STATISTICS' as section,
    'Database Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Total Database Columns' as metric,
    COUNT(*)::text as value
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Tables with RLS Enabled' as metric,
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
    'Platform Tenants' as metric,
    COUNT(*)::text as value
FROM public.tenants

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Platform Users' as metric,
    COUNT(*)::text as value
FROM public.profiles

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Super Administrators' as metric,
    COUNT(*)::text as value
FROM public.super_admins

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Monthly Recurring Revenue' as metric,
    COALESCE(SUM(monthly_price), 0)::text || ' EUR' as value
FROM public.tenants
WHERE subscription_status = 'active';

-- ========================================
-- END OF ULTRA SAFE DATABASE OVERVIEW
-- ========================================