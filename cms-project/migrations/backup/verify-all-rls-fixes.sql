-- Comprehensive verification of all RLS fixes

-- 1. Check for auth.uid() calls that need optimization
SELECT 
  'Auth.uid() optimization' as check_type,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(select auth.uid())%' OR qual LIKE '%( SELECT auth.uid() AS uid)%' THEN '✅ Optimized'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Needs optimization'
    ELSE '✅ No auth.uid()'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%' THEN 0
    ELSE 1
  END,
  tablename, policyname;

-- 2. Summary of auth.uid() optimization status
WITH policy_status AS (
  SELECT 
    CASE 
      WHEN qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(select auth.uid())%' OR qual LIKE '%( SELECT auth.uid() AS uid)%' THEN 'Optimized'
      WHEN qual LIKE '%auth.uid()%' THEN 'Needs optimization'
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

-- 3. Check for multiple permissive policies (performance issue)
SELECT 
  'Multiple permissive policies' as check_type,
  tablename,
  cmd as action,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;

-- 4. Check for duplicate indexes
WITH index_info AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    -- Extract the column list from index definition
    SUBSTRING(indexdef FROM '\((.*?)\)') as column_list
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT 
  'Duplicate index' as check_type,
  tablename,
  STRING_AGG(indexname, ', ') as duplicate_indexes,
  column_list
FROM index_info
GROUP BY tablename, column_list
HAVING COUNT(*) > 1
ORDER BY tablename;

-- 5. Overall summary
SELECT 
  'SUMMARY' as report,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%' AND qual NOT LIKE '%( SELECT auth.uid() AS uid)%') as unoptimized_policies,
  (SELECT COUNT(DISTINCT tablename || '_' || cmd) FROM pg_policies WHERE schemaname = 'public' AND permissive = 'PERMISSIVE' GROUP BY tablename, cmd HAVING COUNT(*) > 1) as tables_with_multiple_policies,
  (SELECT COUNT(*) FROM (SELECT tablename, SUBSTRING(indexdef FROM '\((.*?)\)') as cols FROM pg_indexes WHERE schemaname = 'public' GROUP BY tablename, cols HAVING COUNT(*) > 1) t) as duplicate_index_sets;