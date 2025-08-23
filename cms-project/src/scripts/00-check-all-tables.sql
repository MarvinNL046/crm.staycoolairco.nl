-- Check which tables exist in production
-- This will show ALL tables and identify which ones are missing

WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'tenants', 'profiles', 'companies', 'leads', 'contacts', 'customers',
    'btw_percentages', 'products', 'invoices', 'invoice_items',
    'appointments', 'appointment_reminders', 'recurring_appointments',
    'campaigns', 'campaign_metrics', 'email_templates', 'email_logs',
    'workflows', 'workflow_templates', 'workflow_steps', 'workflow_executions',
    'automation_rules', 'automation_logs', 'pipeline_stages', 'tags',
    'api_keys', 'webhook_logs'
  ]) AS table_name
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
)
SELECT 
  e.table_name,
  CASE 
    WHEN x.table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END AS status
FROM expected_tables e
LEFT JOIN existing_tables x ON e.table_name = x.table_name
ORDER BY 
  CASE 
    WHEN x.table_name IS NULL THEN 0
    ELSE 1
  END,
  e.table_name;