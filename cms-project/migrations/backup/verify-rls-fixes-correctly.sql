-- Correct verification of RLS fixes
-- This accounts for different formatting of the subquery

-- Check all policies with improved detection
SELECT 
  tablename,
  policyname,
  qual,
  CASE 
    -- Check for any form of subquery around auth.uid()
    WHEN qual ~* '\(\s*SELECT\s+auth\.uid\(\).*\)' THEN '✅ Fixed (with subquery)'
    -- Check for bare auth.uid() without subquery
    WHEN qual ~* '(?<!\(\s*SELECT\s+)auth\.uid\(\)(?!\s+AS)' THEN '❌ Needs fixing'
    -- No auth.uid() at all
    WHEN qual !~* 'auth\.uid\(\)' THEN '✅ No auth.uid()'
    -- Default case
    ELSE '✅ Fixed'
  END as status,
  -- Show what pattern was found
  CASE 
    WHEN qual LIKE '%( SELECT auth.uid() AS uid)%' THEN 'Format: ( SELECT auth.uid() AS uid)'
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN 'Format: (SELECT auth.uid())'
    WHEN qual LIKE '%(select auth.uid())%' THEN 'Format: (select auth.uid())'
    WHEN qual LIKE '%auth.uid()%' THEN 'Format: bare auth.uid()'
    ELSE 'No auth.uid() found'
  END as format_found
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities', 'expenses', 'platform_settings', 'super_admins',
    'system_audit_log', 'tasks', 'team_members', 'tenant_users',
    'user_tenants'
  )
ORDER BY 
  CASE 
    WHEN qual ~* '(?<!\(\s*SELECT\s+)auth\.uid\(\)(?!\s+AS)' THEN 0  -- Needs fixing first
    ELSE 1
  END,
  tablename, 
  policyname;

-- Summary count
WITH policy_status AS (
  SELECT 
    CASE 
      WHEN qual ~* '\(\s*SELECT\s+auth\.uid\(\).*\)' THEN 'Fixed'
      WHEN qual ~* 'auth\.uid\(\)' THEN 'Needs fixing'
      ELSE 'No auth.uid()'
    END as status
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  status,
  COUNT(*) as count
FROM policy_status
GROUP BY status
ORDER BY status;

-- Show only the policies that still need fixing (if any)
SELECT 
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual ~* 'auth\.uid\(\)'
  AND qual !~* '\(\s*SELECT\s+auth\.uid\(\).*\)'
ORDER BY tablename, policyname;