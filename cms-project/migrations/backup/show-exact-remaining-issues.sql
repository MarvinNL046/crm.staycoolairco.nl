-- Show the EXACT content of remaining issues to understand why they're not being fixed

-- 1. Show exact function content
SELECT '=== EXACT FUNCTION CONTENT ===' as section;
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as complete_function_body,
    LENGTH(p.prosrc) as body_length
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid()%';

-- 2. Show exact policy qual content
SELECT '' as blank1;
SELECT '=== EXACT POLICY QUAL CONTENT ===' as section;
SELECT 
    tablename,
    policyname,
    qual as complete_qual,
    LENGTH(qual) as qual_length
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(SELECT auth.uid()%'
ORDER BY tablename, policyname;

-- 3. Show exact policy with_check content
SELECT '' as blank2;
SELECT '=== EXACT POLICY WITH_CHECK CONTENT ===' as section;
SELECT 
    tablename,
    policyname,
    with_check as complete_with_check,
    LENGTH(with_check) as check_length
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check LIKE '%auth.uid()%'
  AND with_check NOT LIKE '%(SELECT auth.uid()%'
ORDER BY tablename, policyname;

-- 4. Let's check if these specific items exist
SELECT '' as blank3;
SELECT '=== CHECK SPECIFIC ITEMS ===' as section;

-- Check if get_user_tenant_id still has issues
SELECT 
    'get_user_tenant_id function' as item,
    EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_user_tenant_id'
        AND p.prosrc LIKE '%auth.uid()%'
        AND p.prosrc NOT LIKE '%(SELECT auth.uid()%'
    ) as has_issue;

-- Check v2 policies
SELECT 
    'v2 policies exist' as item,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_v2';

-- 5. Try a different detection pattern
SELECT '' as blank4;
SELECT '=== ALTERNATIVE DETECTION ===' as section;
SELECT 
    'Policies with auth.uid() not wrapped' as check_type,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual ~ 'auth\.uid\(\)(?!\s*\))'  -- auth.uid() not followed by )
    OR with_check ~ 'auth\.uid\(\)(?!\s*\))'
  );