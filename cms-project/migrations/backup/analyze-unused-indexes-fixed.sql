-- Analyze unused indexes to determine which ones are safe to remove
-- Run this script to get a detailed analysis before removing any indexes

-- First, let's see which unused indexes are constraint-based (these should NOT be removed)
WITH constraint_indexes AS (
    SELECT 
        schemaname,
        tablename,
        indexname
    FROM pg_indexes i
    WHERE EXISTS (
        SELECT 1 
        FROM pg_constraint c
        WHERE c.conname = i.indexname
    )
),
-- Get index usage statistics with correct column names
index_usage AS (
    SELECT 
        s.schemaname,
        s.relname as tablename,
        s.indexrelname as indexname,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        s.indexrelid
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
),
-- Get index size information
index_sizes AS (
    SELECT 
        s.schemaname,
        s.relname as tablename,
        s.indexrelname as indexname,
        pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size,
        pg_relation_size(s.indexrelid) as size_bytes
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
)
SELECT 
    iu.tablename,
    iu.indexname,
    CASE 
        WHEN ci.indexname IS NOT NULL THEN 'CONSTRAINT INDEX - DO NOT REMOVE'
        WHEN iu.indexname LIKE '%_pkey' THEN 'PRIMARY KEY - DO NOT REMOVE'
        WHEN iu.indexname LIKE '%_key' THEN 'UNIQUE KEY - PROBABLY KEEP'
        WHEN iu.idx_scan = 0 THEN 'UNUSED - SAFE TO REMOVE'
        ELSE 'USED'
    END as recommendation,
    iu.idx_scan as times_used,
    isz.index_size,
    CASE 
        WHEN iu.idx_scan = 0 AND ci.indexname IS NULL AND iu.indexname NOT LIKE '%_pkey' AND iu.indexname NOT LIKE '%_key' 
        THEN 'DROP INDEX IF EXISTS public.' || iu.indexname || ';'
        ELSE '-- Index is used or is a constraint, keeping it'
    END as drop_statement
FROM index_usage iu
LEFT JOIN constraint_indexes ci ON iu.schemaname = ci.schemaname 
    AND iu.tablename = ci.tablename 
    AND iu.indexname = ci.indexname
LEFT JOIN index_sizes isz ON iu.schemaname = isz.schemaname 
    AND iu.tablename = isz.tablename 
    AND iu.indexname = isz.indexname
WHERE iu.idx_scan = 0  -- Only show unused indexes
ORDER BY 
    CASE 
        WHEN ci.indexname IS NOT NULL THEN 1
        WHEN iu.indexname LIKE '%_pkey' THEN 2
        WHEN iu.indexname LIKE '%_key' THEN 3
        ELSE 4
    END,
    isz.size_bytes DESC;

-- Summary of unused indexes by type
SELECT 
    'Summary of unused indexes' as info;

SELECT 
    CASE 
        WHEN indexrelname LIKE '%_pkey' THEN 'Primary Keys'
        WHEN indexrelname LIKE '%_key' THEN 'Unique Keys'
        WHEN indexrelname LIKE 'idx_%' THEN 'Regular Indexes'
        ELSE 'Other Indexes'
    END as index_type,
    COUNT(*) as count,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
GROUP BY 
    CASE 
        WHEN indexrelname LIKE '%_pkey' THEN 'Primary Keys'
        WHEN indexrelname LIKE '%_key' THEN 'Unique Keys'
        WHEN indexrelname LIKE 'idx_%' THEN 'Regular Indexes'
        ELSE 'Other Indexes'
    END
ORDER BY count DESC;

-- Generate safe DROP statements for truly unused indexes
SELECT 
    'Safe to remove indexes - copy and run these statements:' as info;

SELECT 
    'DROP INDEX IF EXISTS public.' || indexrelname || '; -- ' || relname || ' (' || pg_size_pretty(pg_relation_size(indexrelid)) || ')'
    as drop_statement
FROM pg_stat_user_indexes sui
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname LIKE 'idx_%'  -- Only regular indexes, not constraints
    AND NOT EXISTS (
        -- Make sure it's not a constraint index
        SELECT 1 
        FROM pg_constraint c
        WHERE c.conname = sui.indexrelname
    )
    AND indexrelname NOT IN (
        -- List of indexes we just created or know we need
        'idx_activities_lead_id',
        'idx_activities_tenant_id',
        'idx_activities_user_id',
        'idx_analytics_events_user_id',
        'idx_api_keys_created_by',
        'idx_automation_executions_rule_id',
        'idx_automation_triggers_created_by',
        'idx_automation_triggers_tenant_id_new',
        'idx_automations_template_id',
        'idx_call_logs_contact_id',
        'idx_call_logs_created_by',
        'idx_call_logs_customer_id',
        'idx_campaign_clicks_campaign_id',
        'idx_campaign_clicks_link_id',
        'idx_campaign_clicks_recipient_id',
        'idx_campaign_links_campaign_id',
        'idx_campaign_recipients_campaign_id',
        'idx_campaigns_created_by',
        'idx_contacts_converted_from_lead_id',
        'idx_contacts_created_by',
        'idx_contacts_lead_id',
        'idx_customers_created_by',
        'idx_deals_assigned_to',
        'idx_deals_contact_id',
        'idx_deals_created_by',
        'idx_deals_customer_id',
        'idx_email_logs_campaign_id',
        'idx_email_logs_customer_id',
        'idx_email_logs_template_id',
        'idx_integrations_tenant_id',
        'idx_invoices_created_by',
        'idx_leads_converted_to_contact_id',
        'idx_leads_created_by',
        'idx_leads_tenant_id_new',
        'idx_message_outbox_lead_id',
        'idx_message_outbox_tenant_id_new',
        'idx_products_created_by',
        'idx_profiles_tenant_id',
        'idx_sms_logs_campaign_id',
        'idx_sms_logs_customer_id',
        'idx_sms_logs_template_id',
        'idx_super_admins_created_by',
        'idx_tasks_created_by',
        'idx_team_members_user_id',
        'idx_templates_created_by',
        'idx_tenant_users_user_id',
        'idx_workflows_created_by'
    )
ORDER BY pg_relation_size(indexrelid) DESC;

-- Show total space that will be freed
SELECT 
    'Total space to be freed:' as info,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size,
    COUNT(*) as index_count
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname LIKE 'idx_%'
    AND NOT EXISTS (
        SELECT 1 
        FROM pg_constraint c
        WHERE c.conname = indexrelname
    );