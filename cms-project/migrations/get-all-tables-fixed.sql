-- FIXED COMPREHENSIVE DATABASE OVERVIEW
-- This script works with the actual column names in your database

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
    END as category
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
        WHEN c.column_name LIKE 'subscription_%' THEN '💳 Subscription'
        WHEN c.column_name LIKE 'last_%' THEN '🕐 Activity'
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
-- 4. INDEXES OVERVIEW
-- ========================================
SELECT 
    'INDEXES OVERVIEW' as section,
    schemaname,
    tablename,
    indexname,
    indexdef,
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
-- 5. ROW LEVEL SECURITY STATUS
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
-- 6. SAMPLE DATA FROM KEY TABLES
-- ========================================

-- Tenants data
SELECT 'TENANTS DATA' as section, * FROM public.tenants ORDER BY created_at DESC LIMIT 5;

-- Profiles data (with new activity columns)
SELECT 'PROFILES DATA' as section, 
    id, email, full_name, role, tenant_id, created_at, last_sign_in_at, last_active_at, updated_at
FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- Super admins
SELECT 'SUPER ADMINS' as section, * FROM public.super_admins ORDER BY created_at DESC;

-- CRM Core Data - using safe column selections
SELECT 'LEADS SAMPLE' as section, 
    id, 
    name,
    email, 
    status,
    tenant_id, 
    created_at
FROM public.leads ORDER BY created_at DESC LIMIT 5;

-- Safe contacts query
DO $$
DECLARE
    has_company_column boolean;
    has_name_column boolean;
BEGIN
    -- Check if company column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'company'
    ) INTO has_company_column;

    -- Check if name column exists  
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'name'
    ) INTO has_name_column;

    RAISE NOTICE 'Contacts table - has company column: %, has name column: %', has_company_column, has_name_column;
END $$;

-- Get contacts data safely
SELECT 'CONTACTS SAMPLE' as section,
    c.id,
    COALESCE(c.first_name || ' ' || c.last_name, c.name, 'No name') as full_name,
    c.email,
    c.tenant_id,
    c.created_at
FROM public.contacts c 
ORDER BY c.created_at DESC LIMIT 5;

-- Financial Data
SELECT 'INVOICES SAMPLE' as section,
    id, 
    COALESCE(invoice_number, 'No number') as invoice_number,
    COALESCE(customer_name, 'No customer') as customer_name,
    total, 
    status, 
    tenant_id, 
    created_at
FROM public.invoices ORDER BY created_at DESC LIMIT 3;

-- Activities Data
SELECT 'APPOINTMENTS SAMPLE' as section,
    id, title, start_time, end_time, tenant_id, created_at
FROM public.appointments ORDER BY start_time DESC LIMIT 3;

-- Marketing Data
SELECT 'CAMPAIGNS SAMPLE' as section,
    id, name, type, status, tenant_id, created_at
FROM public.campaigns ORDER BY created_at DESC LIMIT 3;

-- ========================================
-- 7. SUBSCRIPTION OVERVIEW
-- ========================================
SELECT 
    'SUBSCRIPTION OVERVIEW' as section,
    t.name as tenant_name,
    t.subscription_plan,
    t.subscription_status,
    t.monthly_price,
    t.max_users,
    t.max_leads,
    t.subscription_ends_at,
    (SELECT COUNT(*) FROM public.profiles WHERE tenant_id = t.id) as current_users,
    (SELECT COUNT(*) FROM public.leads WHERE tenant_id = t.id) as current_leads,
    CASE 
        WHEN t.subscription_ends_at < NOW() THEN '🚨 EXPIRED'
        WHEN t.subscription_ends_at < NOW() + INTERVAL '30 days' THEN '⚠️ EXPIRING SOON'
        ELSE '✅ ACTIVE'
    END as expiry_status
FROM public.tenants t
ORDER BY t.created_at DESC;

-- ========================================
-- 8. SYSTEM HEALTH METRICS
-- ========================================
WITH table_stats AS (
    SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
)
SELECT 
    'SYSTEM HEALTH' as section,
    tablename,
    live_rows,
    dead_rows,
    inserts + updates + deletes as total_activity,
    CASE 
        WHEN live_rows = 0 THEN '📭 Empty'
        WHEN dead_rows::float / NULLIF(live_rows, 0) > 0.1 THEN '🧹 Needs VACUUM'
        WHEN total_activity > 1000 THEN '🔥 High Activity'
        ELSE '✅ Healthy'
    END as health_status
FROM table_stats
ORDER BY total_activity DESC;

-- ========================================
-- 9. USER ACTIVITY ANALYSIS
-- ========================================
SELECT 
    'USER ACTIVITY ANALYSIS' as section,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE last_sign_in_at IS NOT NULL) as users_with_logins,
    COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as active_last_7_days,
    COUNT(*) FILTER (WHERE last_sign_in_at > NOW() - INTERVAL '30 days') as active_last_30_days,
    COUNT(*) FILTER (WHERE last_sign_in_at IS NULL OR last_sign_in_at < NOW() - INTERVAL '90 days') as inactive_users
FROM public.profiles;

-- Recent user activity
SELECT 
    'RECENT USER ACTIVITY' as section,
    full_name,
    email,
    last_sign_in_at,
    last_active_at,
    CASE 
        WHEN last_sign_in_at IS NULL THEN 'Never logged in'
        WHEN last_sign_in_at > NOW() - INTERVAL '1 day' THEN 'Active today'
        WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Active this week'
        WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'Active this month'
        ELSE 'Inactive'
    END as activity_status
FROM public.profiles 
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- ========================================
-- 10. CUSTOM TYPES AND ENUMS
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
-- 11. FUNCTIONS OVERVIEW
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
        WHEN p.proname LIKE '%update%' THEN '🔄 Triggers'
        ELSE '⚙️ General'
    END as category
FROM pg_proc p
LEFT JOIN pg_language l ON p.prolang = l.oid
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY category, p.proname;

-- ========================================
-- 12. SUMMARY STATISTICS
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
    'Tables with RLS' as metric,
    COUNT(*)::text as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Total Tenants' as metric,
    COUNT(*)::text as value
FROM public.tenants

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Total Users' as metric,
    COUNT(*)::text as value
FROM public.profiles

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Super Admins' as metric,
    COUNT(*)::text as value
FROM public.super_admins

UNION ALL

SELECT 
    'SUMMARY STATISTICS' as section,
    'Monthly Revenue' as metric,
    COALESCE(SUM(monthly_price), 0)::text || ' EUR' as value
FROM public.tenants
WHERE subscription_status = 'active';

-- ========================================
-- END OF FIXED COMPREHENSIVE DATABASE OVERVIEW
-- ========================================