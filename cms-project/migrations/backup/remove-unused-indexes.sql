-- Remove unused indexes that are safe to drop
-- Based on analysis, these indexes have never been used and can be safely removed

BEGIN;

-- These indexes have been confirmed as unused and safe to remove
-- They are not constraint-based and have 0 scans

-- Unused regular indexes
DROP INDEX IF EXISTS public.idx_user_tenants_tenant_id;
DROP INDEX IF EXISTS public.idx_automation_rules_tenant_trigger;
DROP INDEX IF EXISTS public.idx_automation_executions_lead;
DROP INDEX IF EXISTS public.idx_analytics_events_tenant_type_date;
DROP INDEX IF EXISTS public.leads_search_fts_idx;
DROP INDEX IF EXISTS public.idx_customers_tenant_id;
DROP INDEX IF EXISTS public.idx_message_outbox_status_schedule;
DROP INDEX IF EXISTS public.idx_deals_tenant_id;
DROP INDEX IF EXISTS public.idx_tasks_tenant_id;
DROP INDEX IF EXISTS public.idx_tasks_assigned_to;
DROP INDEX IF EXISTS public.idx_tasks_due_date;
DROP INDEX IF EXISTS public.idx_automation_logs_tenant;
DROP INDEX IF EXISTS public.idx_call_logs_tenant_id;
DROP INDEX IF EXISTS public.idx_templates_tenant_id;
DROP INDEX IF EXISTS public.idx_api_keys_tenant_id;
DROP INDEX IF EXISTS public.idx_workflow_steps_workflow;
DROP INDEX IF EXISTS public.idx_appointment_reminders_appointment;
DROP INDEX IF EXISTS public.idx_recurring_appointments_tenant;
DROP INDEX IF EXISTS public.idx_campaign_metrics_campaign;
DROP INDEX IF EXISTS public.idx_automation_logs_rule;
DROP INDEX IF EXISTS public.idx_invoices_lead_id;
DROP INDEX IF EXISTS public.idx_invoices_status;
DROP INDEX IF EXISTS public.idx_products_is_active;
DROP INDEX IF EXISTS public.idx_companies_tenant;
DROP INDEX IF EXISTS public.idx_webhook_logs_tenant;
DROP INDEX IF EXISTS public.idx_email_logs_status;
DROP INDEX IF EXISTS public.idx_email_logs_sent_at;
DROP INDEX IF EXISTS public.idx_email_logs_to_email;
DROP INDEX IF EXISTS public.idx_email_logs_lead_id;
DROP INDEX IF EXISTS public.idx_sms_logs_status;
DROP INDEX IF EXISTS public.idx_sms_logs_sent_at;
DROP INDEX IF EXISTS public.idx_sms_logs_to_phone;
DROP INDEX IF EXISTS public.idx_sms_logs_lead_id;
DROP INDEX IF EXISTS public.appointments_created_by_idx;
DROP INDEX IF EXISTS public.appointments_recurrence_id_idx;
DROP INDEX IF EXISTS public.appointments_is_recurring_idx;
DROP INDEX IF EXISTS public.idx_contacts_mobile;
DROP INDEX IF EXISTS public.idx_contacts_company_name;
DROP INDEX IF EXISTS public.idx_contacts_company_id;
DROP INDEX IF EXISTS public.idx_contacts_status;
DROP INDEX IF EXISTS public.idx_contacts_relationship_status;
DROP INDEX IF EXISTS public.idx_contacts_temperature;
DROP INDEX IF EXISTS public.idx_contacts_city;
DROP INDEX IF EXISTS public.idx_expenses_tenant_id;
DROP INDEX IF EXISTS public.idx_expenses_expense_date;
DROP INDEX IF EXISTS public.idx_expenses_category;
DROP INDEX IF EXISTS public.idx_campaigns_status;
DROP INDEX IF EXISTS public.idx_workflows_tenant_id;
DROP INDEX IF EXISTS public.idx_workflows_status;
DROP INDEX IF EXISTS public.idx_workflows_trigger_type;
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow_id;
DROP INDEX IF EXISTS public.idx_workflow_executions_status;

COMMIT;

-- Verify indexes were removed
SELECT 
    'Unused indexes removed' as status,
    51 - COUNT(*) as indexes_removed
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
        'idx_user_tenants_tenant_id',
        'idx_automation_rules_tenant_trigger',
        'idx_automation_executions_lead',
        'idx_analytics_events_tenant_type_date',
        'leads_search_fts_idx',
        'idx_customers_tenant_id',
        'idx_message_outbox_status_schedule',
        'idx_deals_tenant_id',
        'idx_tasks_tenant_id',
        'idx_tasks_assigned_to',
        'idx_tasks_due_date',
        'idx_automation_logs_tenant',
        'idx_call_logs_tenant_id',
        'idx_templates_tenant_id',
        'idx_api_keys_tenant_id',
        'idx_workflow_steps_workflow',
        'idx_appointment_reminders_appointment',
        'idx_recurring_appointments_tenant',
        'idx_campaign_metrics_campaign',
        'idx_automation_logs_rule',
        'idx_invoices_lead_id',
        'idx_invoices_status',
        'idx_products_is_active',
        'idx_companies_tenant',
        'idx_webhook_logs_tenant',
        'idx_email_logs_status',
        'idx_email_logs_sent_at',
        'idx_email_logs_to_email',
        'idx_email_logs_lead_id',
        'idx_sms_logs_status',
        'idx_sms_logs_sent_at',
        'idx_sms_logs_to_phone',
        'idx_sms_logs_lead_id',
        'appointments_created_by_idx',
        'appointments_recurrence_id_idx',
        'appointments_is_recurring_idx',
        'idx_contacts_mobile',
        'idx_contacts_company_name',
        'idx_contacts_company_id',
        'idx_contacts_status',
        'idx_contacts_relationship_status',
        'idx_contacts_temperature',
        'idx_contacts_city',
        'idx_expenses_tenant_id',
        'idx_expenses_expense_date',
        'idx_expenses_category',
        'idx_campaigns_status',
        'idx_workflows_tenant_id',
        'idx_workflows_status',
        'idx_workflows_trigger_type',
        'idx_workflow_executions_workflow_id',
        'idx_workflow_executions_status'
    );

-- Final check - show remaining performance warnings
SELECT 
    'Performance check after cleanup' as status;

-- Check for remaining unindexed foreign keys
SELECT 
    COUNT(*) as remaining_unindexed_fkeys
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = c.conrelid
            AND a.attnum = ANY(i.indkey)
    );