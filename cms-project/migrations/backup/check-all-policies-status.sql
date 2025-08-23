-- Check status of all policies and remaining issues

-- 1. Check if the v2 policies are optimized
SELECT 
    'V2 POLICIES STATUS:' as section;
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%(SELECT auth.uid()%' THEN '✅ Optimized'
        WHEN qual LIKE '%auth.uid()%' THEN '❌ Not optimized'
        ELSE '✅ No auth.uid()'
    END as qual_status,
    CASE 
        WHEN with_check LIKE '%(SELECT auth.uid()%' THEN '✅ Optimized'
        WHEN with_check LIKE '%auth.uid()%' THEN '❌ Not optimized'
        WHEN with_check IS NULL THEN 'N/A'
        ELSE '✅ No auth.uid()'
    END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_v2'
ORDER BY tablename, policyname;

-- 2. Check ALL policies for auth.uid() issues
SELECT '' as blank1;
SELECT 'ALL POLICIES WITH AUTH.UID() ISSUES:' as section;
SELECT 
    COUNT(*) as total_policies_with_issues,
    COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid()%') as qual_issues,
    COUNT(*) FILTER (WHERE with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid()%') as with_check_issues
FROM pg_policies
WHERE schemaname = 'public';

-- 3. List specific policies that still have issues
SELECT '' as blank2;
SELECT 'POLICIES STILL HAVING ISSUES:' as section;
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid()%' THEN 'qual'
        WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid()%' THEN 'with_check'
        ELSE 'unknown'
    END as issue_location
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid()%')
    OR
    (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid()%')
  )
ORDER BY tablename, policyname
LIMIT 20;  -- Show first 20 to avoid too much output

-- 4. Check functions status
SELECT '' as blank3;
SELECT 'FUNCTIONS WITH AUTH.UID() ISSUES:' as section;
SELECT 
    COUNT(*) as total_functions_with_issues
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid()%';

-- 5. Summary of all issues
SELECT '' as blank4;
SELECT 'FINAL SUMMARY:' as section;
SELECT 
    'auth.uid() issues' as issue_type,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid()%') as functions,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid()%') as policies_qual,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid()%') as policies_with_check;

-- 6. Check for multiple permissive policies
SELECT '' as blank5;
SELECT 'MULTIPLE PERMISSIVE POLICIES:' as section;
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, tablename, cmd
LIMIT 10;  -- Show worst offenders