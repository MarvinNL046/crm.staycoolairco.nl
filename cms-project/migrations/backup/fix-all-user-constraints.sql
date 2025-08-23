-- Fix ALL foreign key constraints that reference auth.users to allow user deletion
BEGIN;

-- ========================================
-- Tables where we want CASCADE DELETE (data should be deleted with user)
-- ========================================

-- API Keys - delete when user is deleted
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_created_by_fkey;
ALTER TABLE public.api_keys 
ADD CONSTRAINT api_keys_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Super Admins - delete when user is deleted
ALTER TABLE public.super_admins DROP CONSTRAINT IF EXISTS super_admins_created_by_fkey;
ALTER TABLE public.super_admins 
ADD CONSTRAINT super_admins_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========================================
-- Tables where we want SET NULL (data should remain but reference cleared)
-- ========================================

-- Automation Triggers
ALTER TABLE public.automation_triggers DROP CONSTRAINT IF EXISTS automation_triggers_created_by_fkey;
ALTER TABLE public.automation_triggers 
ADD CONSTRAINT automation_triggers_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Call Logs
ALTER TABLE public.call_logs DROP CONSTRAINT IF EXISTS call_logs_created_by_fkey;
ALTER TABLE public.call_logs 
ADD CONSTRAINT call_logs_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Campaigns
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_created_by_fkey;
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Contacts
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_created_by_fkey;
ALTER TABLE public.contacts 
ADD CONSTRAINT contacts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Customers
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_created_by_fkey;
ALTER TABLE public.customers 
ADD CONSTRAINT customers_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Deals (both assigned_to and created_by)
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_assigned_to_fkey;
ALTER TABLE public.deals 
ADD CONSTRAINT deals_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_created_by_fkey;
ALTER TABLE public.deals 
ADD CONSTRAINT deals_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Email Templates
ALTER TABLE public.email_templates DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Invoices
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE public.products 
ADD CONSTRAINT products_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Tasks (both assigned_to and created_by)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Templates
ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_created_by_fkey;
ALTER TABLE public.templates 
ADD CONSTRAINT templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Workflows
ALTER TABLE public.workflows DROP CONSTRAINT IF EXISTS workflows_created_by_fkey;
ALTER TABLE public.workflows 
ADD CONSTRAINT workflows_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMIT;

-- Verify all constraints are fixed
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✓ Will delete with user'
        WHEN rc.delete_rule = 'SET NULL' THEN '✓ Will clear reference'
        ELSE '✗ NEEDS FIX'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name IN ('actor_id', 'id', 'assigned_to', 'created_by', 'user_id')
ORDER BY 
    CASE 
        WHEN rc.delete_rule IN ('CASCADE', 'SET NULL') THEN 1
        ELSE 0
    END,
    tc.table_name, 
    tc.constraint_name;