-- Complete database inspection and safe cleanup script for testing
-- This script helps you see all data and safely clean it for testing

-- ========================================
-- PART 1: INSPECT ALL TABLES AND DATA
-- ========================================

-- 1. Show all tables with row counts
SELECT 
    '=== TABLE OVERVIEW WITH ROW COUNTS ===' as section;

SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = pg_tables.tablename AND t.table_schema = pg_tables.schemaname) as exists,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Count rows in each table
SELECT 
    '=== ROW COUNTS PER TABLE ===' as section;

CREATE OR REPLACE FUNCTION count_all_tables()
RETURNS TABLE(table_name text, row_count bigint) AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RETURN QUERY EXECUTE format('SELECT %L::text, COUNT(*)::bigint FROM public.%I', r.tablename, r.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM count_all_tables() WHERE row_count > 0;

-- 3. Show table structure for main business tables
SELECT 
    '=== MAIN BUSINESS TABLES STRUCTURE ===' as section;

SELECT 
    t.table_name,
    STRING_AGG(
        c.column_name || ' (' || c.data_type || 
        CASE WHEN c.is_nullable = 'NO' THEN ', NOT NULL' ELSE '' END || ')',
        ', ' ORDER BY c.ordinal_position
    ) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_name IN (
        'leads', 'contacts', 'customers', 'invoices', 'appointments', 
        'campaigns', 'deals', 'tasks', 'products', 'quotes'
    )
GROUP BY t.table_name
ORDER BY t.table_name;

-- 4. Show current tenant and users
SELECT 
    '=== CURRENT TENANTS ===' as section;
SELECT id, name, created_at FROM tenants;

SELECT 
    '=== CURRENT USERS ===' as section;
SELECT 
    p.id,
    p.full_name,
    p.email,
    tu.tenant_id,
    t.name as tenant_name,
    tu.role
FROM profiles p
LEFT JOIN tenant_users tu ON p.id = tu.user_id
LEFT JOIN tenants t ON tu.tenant_id = t.id;

-- ========================================
-- PART 2: SAFE CLEANUP SCRIPT (COMMENT OUT UNTIL READY)
-- ========================================

-- IMPORTANT: Uncomment the section below when you're ready to clean data for testing
-- This will DELETE all business data but keep the tenant and user structure

/*
BEGIN;

-- Show what will be deleted
SELECT 'WARNING: This will delete all business data!' as warning;

-- Delete in correct order to respect foreign keys
-- (Child tables first, then parent tables)

-- Communications
DELETE FROM email_logs;
DELETE FROM sms_logs;
DELETE FROM call_logs;

-- Campaign related
DELETE FROM campaign_clicks;
DELETE FROM campaign_recipients;
DELETE FROM campaign_links;
DELETE FROM campaign_metrics;
DELETE FROM campaigns;

-- Invoice related
DELETE FROM invoice_items;
DELETE FROM invoices;

-- Appointment related
DELETE FROM appointment_reminders;
DELETE FROM appointments;
DELETE FROM recurring_appointments;

-- Workflow related
DELETE FROM workflow_executions;
DELETE FROM workflow_steps;
DELETE FROM workflows;

-- Automation related
DELETE FROM automation_executions;
DELETE FROM automation_logs;
DELETE FROM automation_triggers;
DELETE FROM automation_rules;
DELETE FROM automations;

-- Main business data
DELETE FROM tasks;
DELETE FROM deals;
DELETE FROM quotes;
DELETE FROM leads;
DELETE FROM contacts;
DELETE FROM customers;
DELETE FROM companies;
DELETE FROM products;

-- Other data
DELETE FROM activities;
DELETE FROM tags;
DELETE FROM expenses;
DELETE FROM message_outbox;
DELETE FROM analytics_events;

-- Keep these tables (user/tenant management):
-- tenants
-- profiles  
-- tenant_users
-- user_tenants
-- team_members
-- super_admins

-- Reset sequences for clean IDs (optional)
-- ALTER SEQUENCE leads_id_seq RESTART WITH 1;
-- ALTER SEQUENCE contacts_id_seq RESTART WITH 1;
-- etc...

SELECT 'Cleanup complete! Business data deleted, tenant/user structure preserved.' as status;

-- COMMIT;  -- Uncomment to actually execute
-- ROLLBACK; -- Or use this to test without applying changes
*/

-- ========================================
-- PART 3: QUICK DATA GENERATORS FOR TESTING
-- ========================================

-- After cleanup, you can use these to add test data:

/*
-- Add test leads
INSERT INTO leads (name, email, phone, company, status, source, tenant_id, created_by)
SELECT 
    'Test Lead ' || generate_series,
    'lead' || generate_series || '@test.com',
    '06-' || (10000000 + generate_series),
    'Company ' || generate_series,
    CASE (generate_series % 3)
        WHEN 0 THEN 'new'
        WHEN 1 THEN 'contacted'
        ELSE 'qualified'
    END,
    'website',
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM profiles LIMIT 1)
FROM generate_series(1, 10);

-- Add test contacts
INSERT INTO contacts (first_name, last_name, email, phone, tenant_id, created_by)
SELECT 
    'John' || generate_series,
    'Doe' || generate_series,
    'contact' || generate_series || '@test.com',
    '06-' || (20000000 + generate_series),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM profiles LIMIT 1)
FROM generate_series(1, 10);

-- Add test appointments
INSERT INTO appointments (title, start_time, end_time, customer_name, customer_email, tenant_id, created_by)
SELECT 
    'Test Appointment ' || generate_series,
    NOW() + (generate_series || ' days')::interval,
    NOW() + (generate_series || ' days')::interval + '1 hour'::interval,
    'Customer ' || generate_series,
    'customer' || generate_series || '@test.com',
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM profiles LIMIT 1)
FROM generate_series(1, 5);

SELECT 'Test data added!' as status;
*/

-- ========================================
-- PART 4: VERIFY DATA STATE
-- ========================================

SELECT 
    '=== FINAL DATA STATE ===' as section;

SELECT 
    table_name,
    row_count,
    CASE 
        WHEN table_name IN ('tenants', 'profiles', 'tenant_users', 'user_tenants', 'team_members', 'super_admins') 
            THEN '🔒 Keep (User/Tenant data)'
        WHEN row_count = 0 
            THEN '✅ Empty (ready for testing)'
        ELSE '📊 Has data (' || row_count || ' rows)'
    END as status
FROM (
    SELECT * FROM count_all_tables()
) counts
ORDER BY 
    CASE 
        WHEN table_name IN ('tenants', 'profiles', 'tenant_users', 'user_tenants', 'team_members', 'super_admins') THEN 1
        WHEN row_count = 0 THEN 2
        ELSE 3
    END,
    table_name;