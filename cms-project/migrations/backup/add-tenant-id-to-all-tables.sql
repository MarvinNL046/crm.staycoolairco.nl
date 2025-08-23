-- CRITICAL SECURITY FIX: Add tenant_id to all business tables for multi-tenant isolation
-- This migration adds tenant_id to tables that are missing it and updates RLS policies

BEGIN;

-- ========================================
-- 1. Add tenant_id to tables that need it
-- ========================================

-- Helper function to get tenant_id from related tables
CREATE OR REPLACE FUNCTION get_tenant_for_migration(table_name text, record_id uuid)
RETURNS uuid AS $$
DECLARE
    tenant_uuid uuid;
BEGIN
    -- Try to find tenant_id through various relationships
    CASE table_name
        WHEN 'appointment_reminders' THEN
            SELECT a.tenant_id INTO tenant_uuid
            FROM appointments a
            JOIN appointment_reminders ar ON ar.appointment_id = a.id
            WHERE ar.id = record_id;
            
        WHEN 'campaign_clicks' THEN
            SELECT c.tenant_id INTO tenant_uuid
            FROM campaigns c
            JOIN campaign_clicks cc ON cc.campaign_id = c.id
            WHERE cc.id = record_id;
            
        WHEN 'campaign_links' THEN
            SELECT c.tenant_id INTO tenant_uuid
            FROM campaigns c
            JOIN campaign_links cl ON cl.campaign_id = c.id
            WHERE cl.id = record_id;
            
        WHEN 'campaign_metrics' THEN
            SELECT c.tenant_id INTO tenant_uuid
            FROM campaigns c
            JOIN campaign_metrics cm ON cm.campaign_id = c.id
            WHERE cm.id = record_id;
            
        WHEN 'campaign_recipients' THEN
            SELECT c.tenant_id INTO tenant_uuid
            FROM campaigns c
            JOIN campaign_recipients cr ON cr.campaign_id = c.id
            WHERE cr.id = record_id;
            
        WHEN 'invoice_items' THEN
            SELECT i.tenant_id INTO tenant_uuid
            FROM invoices i
            JOIN invoice_items ii ON ii.invoice_id = i.id
            WHERE ii.id = record_id;
            
        WHEN 'workflow_executions' THEN
            SELECT w.tenant_id INTO tenant_uuid
            FROM workflows w
            JOIN workflow_executions we ON we.workflow_id = w.id
            WHERE we.id = record_id;
            
        WHEN 'workflow_steps' THEN
            SELECT w.tenant_id INTO tenant_uuid
            FROM workflows w
            JOIN workflow_steps ws ON ws.workflow_id = w.id
            WHERE ws.id = record_id;
            
        ELSE
            -- For other tables, try to get the default tenant
            SELECT id INTO tenant_uuid FROM tenants LIMIT 1;
    END CASE;
    
    RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add tenant_id to appointment_reminders
ALTER TABLE appointment_reminders ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE appointment_reminders ar
SET tenant_id = a.tenant_id
FROM appointments a
WHERE ar.appointment_id = a.id
AND ar.tenant_id IS NULL;
ALTER TABLE appointment_reminders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE appointment_reminders ADD CONSTRAINT appointment_reminders_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to campaign_clicks
ALTER TABLE campaign_clicks ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE campaign_clicks cc
SET tenant_id = c.tenant_id
FROM campaigns c
WHERE cc.campaign_id = c.id
AND cc.tenant_id IS NULL;
ALTER TABLE campaign_clicks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE campaign_clicks ADD CONSTRAINT campaign_clicks_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to campaign_links
ALTER TABLE campaign_links ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE campaign_links cl
SET tenant_id = c.tenant_id
FROM campaigns c
WHERE cl.campaign_id = c.id
AND cl.tenant_id IS NULL;
ALTER TABLE campaign_links ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE campaign_links ADD CONSTRAINT campaign_links_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to campaign_metrics
ALTER TABLE campaign_metrics ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE campaign_metrics cm
SET tenant_id = c.tenant_id
FROM campaigns c
WHERE cm.campaign_id = c.id
AND cm.tenant_id IS NULL;
ALTER TABLE campaign_metrics ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE campaign_metrics ADD CONSTRAINT campaign_metrics_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to campaign_recipients
ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE campaign_recipients cr
SET tenant_id = c.tenant_id
FROM campaigns c
WHERE cr.campaign_id = c.id
AND cr.tenant_id IS NULL;
ALTER TABLE campaign_recipients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE campaign_recipients ADD CONSTRAINT campaign_recipients_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to invoice_items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE invoice_items ii
SET tenant_id = i.tenant_id
FROM invoices i
WHERE ii.invoice_id = i.id
AND ii.tenant_id IS NULL;
ALTER TABLE invoice_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to pipeline_stages
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE pipeline_stages
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL;
ALTER TABLE pipeline_stages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pipeline_stages ADD CONSTRAINT pipeline_stages_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to platform_settings (this might be shared, but safer to isolate)
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE platform_settings
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL;
-- Platform settings might be nullable for global settings
ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to system_audit_log
ALTER TABLE system_audit_log ADD COLUMN IF NOT EXISTS tenant_id uuid;
-- Get tenant from actor's profile
UPDATE system_audit_log sal
SET tenant_id = tu.tenant_id
FROM tenant_users tu
WHERE tu.user_id = sal.actor_id
AND sal.tenant_id IS NULL;
-- Not setting NOT NULL as system events might not have tenant
ALTER TABLE system_audit_log ADD CONSTRAINT system_audit_log_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to workflow_actions
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE workflow_actions
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL;
ALTER TABLE workflow_actions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workflow_actions ADD CONSTRAINT workflow_actions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to workflow_executions
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE workflow_executions we
SET tenant_id = w.tenant_id
FROM workflows w
WHERE we.workflow_id = w.id
AND we.tenant_id IS NULL;
ALTER TABLE workflow_executions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workflow_executions ADD CONSTRAINT workflow_executions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to workflow_steps
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE workflow_steps ws
SET tenant_id = w.tenant_id
FROM workflows w
WHERE ws.workflow_id = w.id
AND ws.tenant_id IS NULL;
ALTER TABLE workflow_steps ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workflow_steps ADD CONSTRAINT workflow_steps_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to workflow_templates
ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE workflow_templates
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL;
-- Templates might be shared, so nullable
ALTER TABLE workflow_templates ADD CONSTRAINT workflow_templates_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to workflow_triggers
ALTER TABLE workflow_triggers ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE workflow_triggers
SET tenant_id = (SELECT id FROM tenants LIMIT 1)
WHERE tenant_id IS NULL;
ALTER TABLE workflow_triggers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE workflow_triggers ADD CONSTRAINT workflow_triggers_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- ========================================
-- 2. Create indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_tenant_id ON appointment_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_tenant_id ON campaign_clicks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_links_tenant_id ON campaign_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_tenant_id ON campaign_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_tenant_id ON campaign_recipients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_id ON invoice_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant_id ON pipeline_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_tenant_id ON platform_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_tenant_id ON system_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_tenant_id ON workflow_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant_id ON workflow_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_tenant_id ON workflow_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_tenant_id ON workflow_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_tenant_id ON workflow_triggers(tenant_id);

-- ========================================
-- 3. Add RLS policies for new tenant_id columns
-- ========================================

-- Generic function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM tenant_users 
        WHERE user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for each table
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'appointment_reminders', 'campaign_clicks', 'campaign_links',
            'campaign_metrics', 'campaign_recipients', 'invoice_items',
            'pipeline_stages', 'platform_settings', 'system_audit_log',
            'workflow_actions', 'workflow_executions', 'workflow_steps',
            'workflow_templates', 'workflow_triggers'
        )
    LOOP
        -- Drop existing policies if any
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_select ON %I', table_rec.tablename);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_insert ON %I', table_rec.tablename);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_update ON %I', table_rec.tablename);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_delete ON %I', table_rec.tablename);
        
        -- Create new tenant isolation policies
        EXECUTE format('
            CREATE POLICY tenant_isolation_select ON %I
            FOR SELECT USING (tenant_id = get_user_tenant_id())
        ', table_rec.tablename);
        
        EXECUTE format('
            CREATE POLICY tenant_isolation_insert ON %I
            FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id())
        ', table_rec.tablename);
        
        EXECUTE format('
            CREATE POLICY tenant_isolation_update ON %I
            FOR UPDATE USING (tenant_id = get_user_tenant_id())
            WITH CHECK (tenant_id = get_user_tenant_id())
        ', table_rec.tablename);
        
        EXECUTE format('
            CREATE POLICY tenant_isolation_delete ON %I
            FOR DELETE USING (tenant_id = get_user_tenant_id())
        ', table_rec.tablename);
    END LOOP;
END $$;

-- Clean up migration helper
DROP FUNCTION IF EXISTS get_tenant_for_migration;

COMMIT;

-- ========================================
-- 4. Verify the fix
-- ========================================
SELECT 
    'VERIFICATION: Tables without tenant_id after migration' as check_type,
    COUNT(*) as count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members')
    AND t.table_name NOT LIKE '%_config'
    AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema 
        AND c.table_name = t.table_name 
        AND c.column_name = 'tenant_id'
    );

SELECT 
    'VERIFICATION: All tables with tenant_id now have RLS policies' as check_type,
    t.table_name,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema 
        AND c.table_name = t.table_name 
        AND c.column_name = 'tenant_id'
    )
GROUP BY t.table_name
ORDER BY policy_count, t.table_name;