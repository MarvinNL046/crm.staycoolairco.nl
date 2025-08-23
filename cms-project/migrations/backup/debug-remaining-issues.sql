-- Debug script to see exactly what still needs fixing

-- 1. Show the 2 remaining functions with auth.uid()
SELECT 'REMAINING FUNCTIONS WITH AUTH.UID():' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as full_function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid())%'
ORDER BY p.proname;

-- 2. Show the 8 policies with auth.uid() in qual
SELECT '' as blank1;
SELECT 'REMAINING POLICIES WITH AUTH.UID() IN QUAL:' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(SELECT auth.uid())%'
  AND qual NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;

-- 3. Show the 1 policy with auth.uid() in with_check
SELECT '' as blank2;
SELECT 'REMAINING POLICIES WITH AUTH.UID() IN WITH_CHECK:' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check LIKE '%auth.uid()%'
  AND with_check NOT LIKE '%(SELECT auth.uid())%'
  AND with_check NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;

-- 4. Check if these are new policies that were created after our fixes
SELECT '' as blank3;
SELECT 'CHECK POLICY DETAILS:' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'qual has issue'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'with_check has issue'
        ELSE 'unknown'
    END as issue_location
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%')
    OR
    (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%')
  )
ORDER BY tablename, policyname;