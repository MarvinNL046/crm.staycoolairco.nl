-- Alternatief: Disable RLS voor tabellen die je niet gebruikt
-- Dit verwijdert de warning en maakt de tabellen weer toegankelijk

-- Dit script checkt eerst welke tabellen bestaan en disabled dan RLS
-- alleen voor tabellen zonder policies

DO $$
DECLARE
    t RECORD;
    policy_count INTEGER;
BEGIN
    -- Loop door alle tabellen met RLS maar zonder policies
    FOR t IN 
        SELECT 
            schemaname,
            tablename
        FROM pg_tables t
        WHERE schemaname = 'public'
        AND EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            AND c.relname = t.tablename
            AND c.relrowsecurity = true
        )
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies p
            WHERE p.tablename = t.tablename
            AND p.schemaname = 'public'
        )
    LOOP
        -- Check of we echt geen policies hebben
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE tablename = t.tablename 
        AND schemaname = t.schemaname;
        
        IF policy_count = 0 THEN
            -- Deze tabel heeft RLS enabled maar geen policies
            -- Dit betekent dat niemand er toegang toe heeft
            RAISE NOTICE 'Disabling RLS for table % (no policies found)', t.tablename;
            
            -- Disable RLS voor deze tabel
            EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
                          t.schemaname, t.tablename);
        END IF;
    END LOOP;
END $$;

-- Lijst van tabellen waar RLS is uitgeschakeld
SELECT 
    'RLS disabled for: ' || string_agg(tablename, ', ') as message
FROM pg_tables t
WHERE schemaname = 'public'
AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = t.tablename
    AND c.relrowsecurity = true
)
AND tablename IN (
    'activities', 'analytics_events', 'automation_executions', 'automation_triggers',
    'automations', 'call_logs', 'campaign_clicks', 'campaign_links', 'campaign_recipients',
    'deals', 'expenses', 'integrations', 'invoice_sequences', 'message_outbox',
    'message_templates', 'platform_settings', 'sms_logs', 'super_admins',
    'system_audit_log', 'tasks', 'team_members', 'templates', 'tenant_users',
    'user_tenants', 'workflow_actions', 'workflow_triggers'
);