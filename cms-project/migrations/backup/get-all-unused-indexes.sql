-- Get all unused indexes that are safe to remove
-- This will generate the complete list of DROP statements

SELECT 
    'DROP INDEX IF EXISTS public.' || indexrelname || ';'
    as drop_statement
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname LIKE 'idx_%'
    AND NOT EXISTS (
        SELECT 1 
        FROM pg_constraint c
        WHERE c.conname = indexrelname
    )
    AND indexrelname NOT IN (
        -- List of indexes we just created that we want to keep
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
ORDER BY indexrelname;