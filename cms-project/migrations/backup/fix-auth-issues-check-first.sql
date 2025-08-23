-- First check what needs to be fixed before making changes

-- 1. Check functions that need fixing
SELECT 'FUNCTIONS WITH AUTH.UID():' as section;
SELECT 
    p.proname as function_name,
    p.pronargs as num_args,
    pg_get_function_arguments(p.oid) as arguments,
    LEFT(p.prosrc, 200) as function_body_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid())%';

-- 2. Check policies that need fixing
SELECT '' as blank1;
SELECT 'POLICIES WITH AUTH.UID() IN QUAL:' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    LEFT(qual, 200) as qual_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(SELECT auth.uid())%'
  AND qual NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;

SELECT '' as blank2;
SELECT 'POLICIES WITH AUTH.UID() IN WITH_CHECK:' as section;
SELECT 
    tablename,
    policyname,
    cmd,
    LEFT(with_check, 200) as with_check_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check LIKE '%auth.uid()%'
  AND with_check NOT LIKE '%(SELECT auth.uid())%'
  AND with_check NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;

-- 3. Check the structure of specific tables
SELECT '' as blank3;
SELECT 'USER_TENANTS TABLE STRUCTURE:' as section;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_tenants'
ORDER BY ordinal_position;

-- 4. Check existing policy definitions for user_tenants
SELECT '' as blank4;
SELECT 'USER_TENANTS POLICIES:' as section;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_tenants';

-- 5. Summary count
SELECT '' as blank5;
SELECT 'SUMMARY:' as section;
SELECT 
    'Total issues' as metric,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid())%') as functions,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%') as policies_qual,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%') as policies_with_check;