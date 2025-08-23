-- Check welke van deze tabellen echt bestaan en welke columns ze hebben
-- Dit helpt om te bepalen welke policies we nodig hebben

-- Check alle tabellen die in de warning staan
WITH warning_tables AS (
    SELECT unnest(ARRAY[
        'activities', 'analytics_events', 'automation_executions', 'automation_triggers',
        'automations', 'call_logs', 'campaign_clicks', 'campaign_links', 'campaign_recipients',
        'deals', 'expenses', 'integrations', 'invoice_sequences', 'message_outbox',
        'message_templates', 'platform_settings', 'sms_logs', 'super_admins',
        'system_audit_log', 'tasks', 'team_members', 'templates', 'tenant_users',
        'user_tenants', 'workflow_actions', 'workflow_triggers'
    ]) AS table_name
)
SELECT 
    w.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✅ HAS tenant_id'
        WHEN t.table_name IS NOT NULL THEN '⚠️ NO tenant_id'
        ELSE '-'
    END as tenant_column,
    (
        SELECT COUNT(*) 
        FROM pg_policies p 
        WHERE p.tablename = w.table_name 
        AND p.schemaname = 'public'
    ) as policy_count
FROM warning_tables w
LEFT JOIN information_schema.tables t 
    ON t.table_schema = 'public' 
    AND t.table_name = w.table_name
LEFT JOIN information_schema.columns c 
    ON c.table_schema = 'public' 
    AND c.table_name = w.table_name 
    AND c.column_name = 'tenant_id'
ORDER BY 
    CASE WHEN t.table_name IS NOT NULL THEN 0 ELSE 1 END,
    w.table_name;

-- Voor tabellen die bestaan, toon de columns
SELECT 
    table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'activities', 'analytics_events', 'automation_executions', 'automation_triggers',
    'automations', 'call_logs', 'campaign_clicks', 'campaign_links', 'campaign_recipients',
    'deals', 'expenses', 'integrations', 'invoice_sequences', 'message_outbox',
    'message_templates', 'platform_settings', 'sms_logs', 'super_admins',
    'system_audit_log', 'tasks', 'team_members', 'templates', 'tenant_users',
    'user_tenants', 'workflow_actions', 'workflow_triggers'
)
GROUP BY table_name
ORDER BY table_name;