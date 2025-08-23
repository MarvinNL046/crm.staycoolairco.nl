-- Fix Multiple Permissive Policies and Duplicate Indexes

BEGIN;

-- Part 1: Show Multiple Permissive Policies (for manual review)
-- These need careful consideration as they might have different logic
SELECT 
    schemaname,
    tablename,
    cmd,
    array_agg(policyname ORDER BY policyname) as policies,
    count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY schemaname, tablename, cmd, roles
HAVING count(*) > 1
ORDER BY tablename, cmd;

-- Part 2: Fix Duplicate Indexes
-- Drop duplicate indexes on api_keys table
DROP INDEX IF EXISTS public.idx_api_keys_tenant;  -- Keep idx_api_keys_tenant_id

-- Drop duplicate indexes on workflow_executions table  
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow;  -- Keep idx_workflow_executions_workflow_id

-- Verify indexes are fixed
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('api_keys', 'workflow_executions')
ORDER BY tablename, indexname;

COMMIT;

-- Recommendations for Multiple Permissive Policies:
-- 
-- The multiple permissive policies warnings indicate that you have multiple policies
-- that can grant access for the same action. While this works, it's inefficient
-- because PostgreSQL must evaluate all policies.
--
-- Options to fix:
-- 1. Combine policies using OR logic in a single policy
-- 2. Keep separate policies if they serve different security purposes
-- 
-- Example of combining policies:
-- Instead of:
--   - Policy 1: "Admins can manage all expenses"
--   - Policy 2: "Users can view their tenant's expenses"
-- 
-- Create one policy:
--   "Users can view expenses" with logic:
--   (is_admin = true) OR (tenant_id = get_user_tenant_id(auth.uid()))
--
-- This is more efficient but might be less clear for maintenance.