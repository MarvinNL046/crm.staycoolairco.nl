-- Fix unindexed foreign keys for better performance
-- This migration adds indexes to foreign key columns that don't have them

BEGIN;

-- Activities table
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_tenant_id ON public.activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

-- Analytics events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

-- API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON public.api_keys(created_by);

-- Automation executions
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON public.automation_executions(automation_rule_id);

-- Automation triggers
CREATE INDEX IF NOT EXISTS idx_automation_triggers_created_by ON public.automation_triggers(created_by);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_tenant_id_new ON public.automation_triggers(tenant_id);

-- Automations
CREATE INDEX IF NOT EXISTS idx_automations_template_id ON public.automations(template_id);

-- Call logs
CREATE INDEX IF NOT EXISTS idx_call_logs_contact_id ON public.call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_by ON public.call_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON public.call_logs(customer_id);

-- Campaign related tables
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id ON public.campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_link_id ON public.campaign_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_recipient_id ON public.campaign_clicks(recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_links_campaign_id ON public.campaign_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.campaigns(created_by);

-- Contacts
CREATE INDEX IF NOT EXISTS idx_contacts_converted_from_lead_id ON public.contacts(converted_from_lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON public.contacts(lead_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);

-- Deals
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON public.deals(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON public.deals(customer_id);

-- Email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON public.email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id ON public.email_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON public.email_logs(template_id);

-- Integrations
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_id ON public.integrations(tenant_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_converted_to_contact_id ON public.leads(converted_to_contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id_new ON public.leads(tenant_id);

-- Message outbox
CREATE INDEX IF NOT EXISTS idx_message_outbox_lead_id ON public.message_outbox(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_outbox_tenant_id_new ON public.message_outbox(tenant_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- SMS logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_campaign_id ON public.sms_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_customer_id ON public.sms_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_template_id ON public.sms_logs(template_id);

-- Super admins
CREATE INDEX IF NOT EXISTS idx_super_admins_created_by ON public.super_admins(created_by);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- Team members
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Templates
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);

-- Tenant users
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);

-- Workflows
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON public.workflows(created_by);

COMMIT;

-- Verify the indexes were created
SELECT 
    'Foreign key indexes created' as status,
    COUNT(*) as new_indexes
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname IN (
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
    );