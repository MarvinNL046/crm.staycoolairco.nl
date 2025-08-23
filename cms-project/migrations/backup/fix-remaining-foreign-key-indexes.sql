-- Fix remaining unindexed foreign keys
-- These are tenant_id and other foreign keys that were missed in the first round

BEGIN;

-- Analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_id ON public.analytics_events(tenant_id);

-- API keys  
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id_fk ON public.api_keys(tenant_id);

-- Appointment reminders
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON public.appointment_reminders(appointment_id);

-- Automation executions
CREATE INDEX IF NOT EXISTS idx_automation_executions_lead_id ON public.automation_executions(lead_id);

-- Automation logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_tenant_id_fk ON public.automation_logs(tenant_id);

-- Automation rules
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON public.automation_rules(tenant_id);

-- Call logs
CREATE INDEX IF NOT EXISTS idx_call_logs_tenant_id_fk ON public.call_logs(tenant_id);

-- Campaign metrics
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON public.campaign_metrics(campaign_id);

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON public.companies(tenant_id);

-- Contacts - company_id
CREATE INDEX IF NOT EXISTS idx_contacts_company_id_fk ON public.contacts(company_id);

-- Email logs - lead_id
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id_fk ON public.email_logs(lead_id);

-- Invoices - lead_id
CREATE INDEX IF NOT EXISTS idx_invoices_lead_id_fk ON public.invoices(lead_id);

-- Recurring appointments
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_tenant_id ON public.recurring_appointments(tenant_id);

-- SMS logs - lead_id
CREATE INDEX IF NOT EXISTS idx_sms_logs_lead_id_fk ON public.sms_logs(lead_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_fk ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id_fk ON public.tasks(tenant_id);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_tenant_id_fk ON public.templates(tenant_id);

-- User tenants
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id_fk ON public.user_tenants(tenant_id);

-- Webhook logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tenant_id ON public.webhook_logs(tenant_id);

-- Workflow executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);

-- Workflow steps
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);

COMMIT;

-- Verify the new indexes were created
SELECT 
    'Additional foreign key indexes created' as status,
    COUNT(*) as new_indexes
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
        'idx_analytics_events_tenant_id',
        'idx_api_keys_tenant_id_fk',
        'idx_appointment_reminders_appointment_id',
        'idx_automation_executions_lead_id',
        'idx_automation_logs_rule_id',
        'idx_automation_logs_tenant_id_fk',
        'idx_automation_rules_tenant_id',
        'idx_call_logs_tenant_id_fk',
        'idx_campaign_metrics_campaign_id',
        'idx_companies_tenant_id',
        'idx_contacts_company_id_fk',
        'idx_email_logs_lead_id_fk',
        'idx_invoices_lead_id_fk',
        'idx_recurring_appointments_tenant_id',
        'idx_sms_logs_lead_id_fk',
        'idx_tasks_assigned_to_fk',
        'idx_tasks_tenant_id_fk',
        'idx_templates_tenant_id_fk',
        'idx_user_tenants_tenant_id_fk',
        'idx_webhook_logs_tenant_id',
        'idx_workflow_executions_workflow_id',
        'idx_workflow_steps_workflow_id'
    );

-- Final check for unindexed foreign keys
SELECT 
    'Final check - unindexed foreign keys' as status,
    COUNT(*) as remaining_unindexed
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid
        WHERE i.indrelid = c.conrelid
            AND a.attnum = ANY(c.conkey)
            AND a.attnum = ANY(i.indkey)
    );