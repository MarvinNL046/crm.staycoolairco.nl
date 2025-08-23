-- Fix voor alle tabellen met RLS enabled maar zonder policies
-- Dit voegt basis RLS policies toe voor multi-tenant isolatie

-- Eerst checken welke tabellen écht bestaan
DO $$
DECLARE
    t RECORD;
    table_exists BOOLEAN;
BEGIN
    -- Loop door alle gemelde tabellen
    FOR t IN 
        SELECT unnest(ARRAY[
            'activities', 'analytics_events', 'automation_executions', 'automation_triggers',
            'automations', 'call_logs', 'campaign_clicks', 'campaign_links', 'campaign_recipients',
            'deals', 'expenses', 'integrations', 'invoice_sequences', 'message_outbox',
            'message_templates', 'platform_settings', 'sms_logs', 'super_admins',
            'system_audit_log', 'tasks', 'team_members', 'templates', 'tenant_users',
            'user_tenants', 'workflow_actions', 'workflow_triggers'
        ]) AS table_name
    LOOP
        -- Check of tabel bestaat
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE 'Tabel % bestaat', t.table_name;
        END IF;
    END LOOP;
END $$;

-- Policies voor tabellen die waarschijnlijk tenant-scoped zijn
-- (de meeste business data)

-- Activities
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        CREATE POLICY "Users can manage their tenant's activities" ON activities
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
END $$;

-- Analytics Events
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
        CREATE POLICY "Users can manage their tenant's analytics" ON analytics_events
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
END $$;

-- Automation tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automations') THEN
        CREATE POLICY "Users can manage their tenant's automations" ON automations
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_executions') THEN
        CREATE POLICY "Users can view their automation executions" ON automation_executions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM automations 
                    WHERE automations.id = automation_executions.automation_id 
                    AND automations.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_triggers') THEN
        CREATE POLICY "Users can manage their automation triggers" ON automation_triggers
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM automations 
                    WHERE automations.id = automation_triggers.automation_id 
                    AND automations.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
END $$;

-- Campaign tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_recipients') THEN
        CREATE POLICY "Users can manage campaign recipients" ON campaign_recipients
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM campaigns 
                    WHERE campaigns.id = campaign_recipients.campaign_id 
                    AND campaigns.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_links') THEN
        CREATE POLICY "Users can manage campaign links" ON campaign_links
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM campaigns 
                    WHERE campaigns.id = campaign_links.campaign_id 
                    AND campaigns.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_clicks') THEN
        CREATE POLICY "Users can view campaign clicks" ON campaign_clicks
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM campaign_links 
                    JOIN campaigns ON campaigns.id = campaign_links.campaign_id
                    WHERE campaign_links.id = campaign_clicks.link_id 
                    AND campaigns.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
END $$;

-- Communication logs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs') THEN
        CREATE POLICY "Users can manage their tenant's call logs" ON call_logs
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sms_logs') THEN
        CREATE POLICY "Users can manage their tenant's SMS logs" ON sms_logs
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_outbox') THEN
        CREATE POLICY "Users can manage their message outbox" ON message_outbox
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates') THEN
        CREATE POLICY "Users can manage their message templates" ON message_templates
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
END $$;

-- Business data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals') THEN
        CREATE POLICY "Users can manage their tenant's deals" ON deals
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') THEN
        CREATE POLICY "Users can manage their tenant's expenses" ON expenses
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        CREATE POLICY "Users can manage their tenant's tasks" ON tasks
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
        CREATE POLICY "Users can manage their tenant's templates" ON templates
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
END $$;

-- System & Configuration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integrations') THEN
        CREATE POLICY "Users can manage their tenant's integrations" ON integrations
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_sequences') THEN
        CREATE POLICY "Users can manage their invoice sequences" ON invoice_sequences
            FOR ALL USING (tenant_id = public.get_user_tenant_id());
    END IF;
END $$;

-- Team & User Management
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
        CREATE POLICY "Users can view their team members" ON team_members
            FOR SELECT USING (tenant_id = public.get_user_tenant_id());
        
        CREATE POLICY "Admins can manage team members" ON team_members
            FOR ALL USING (
                tenant_id = public.get_user_tenant_id() AND
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role IN ('admin', 'owner')
                )
            );
    END IF;
    
    -- tenant_users en user_tenants zijn waarschijnlijk junction tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_users') THEN
        CREATE POLICY "Users can view their tenant users" ON tenant_users
            FOR SELECT USING (tenant_id = public.get_user_tenant_id());
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tenants') THEN
        CREATE POLICY "Users can view their tenants" ON user_tenants
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

-- Workflow tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_actions') THEN
        CREATE POLICY "Users can manage workflow actions" ON workflow_actions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM workflows 
                    WHERE workflows.id = workflow_actions.workflow_id 
                    AND workflows.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_triggers') THEN
        CREATE POLICY "Users can manage workflow triggers" ON workflow_triggers
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM workflows 
                    WHERE workflows.id = workflow_triggers.workflow_id 
                    AND workflows.tenant_id = public.get_user_tenant_id()
                )
            );
    END IF;
END $$;

-- Admin-only tables (zeer restrictief!)
DO $$
BEGIN
    -- Platform settings - alleen super admins
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_settings') THEN
        CREATE POLICY "Only super admins can manage platform settings" ON platform_settings
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM super_admins 
                    WHERE super_admins.user_id = auth.uid()
                )
            );
    END IF;
    
    -- Super admins - alleen bestaande super admins kunnen zien
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'super_admins') THEN
        CREATE POLICY "Only super admins can view super admins" ON super_admins
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM super_admins sa 
                    WHERE sa.user_id = auth.uid()
                )
            );
    END IF;
    
    -- System audit log - alleen super admins of eigen tenant admins
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_audit_log') THEN
        CREATE POLICY "View audit logs" ON system_audit_log
            FOR SELECT USING (
                -- Super admin kan alles zien
                EXISTS (
                    SELECT 1 FROM super_admins 
                    WHERE super_admins.user_id = auth.uid()
                )
                OR
                -- Tenant admin kan eigen tenant logs zien
                (
                    tenant_id = public.get_user_tenant_id() AND
                    EXISTS (
                        SELECT 1 FROM profiles 
                        WHERE profiles.id = auth.uid() 
                        AND profiles.role IN ('admin', 'owner')
                    )
                )
            );
    END IF;
END $$;

-- Check welke tabellen nu nog steeds geen policies hebben
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
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
ORDER BY tablename;