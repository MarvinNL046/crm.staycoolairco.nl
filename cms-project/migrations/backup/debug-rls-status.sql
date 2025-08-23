-- Debug RLS status to understand why warnings persist

-- 1. Check specific policies mentioned in warnings
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ Wrapped in SELECT'
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Wrapped in select' 
    WHEN qual LIKE '%( SELECT auth.uid() AS uid)%' THEN '✅ Wrapped with AS uid'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Not wrapped'
    ELSE '✅ No auth.uid()'
  END as qual_status,
  CASE 
    WHEN with_check LIKE '%(SELECT auth.uid())%' THEN '✅ Wrapped in SELECT'
    WHEN with_check LIKE '%(select auth.uid())%' THEN '✅ Wrapped in select'
    WHEN with_check LIKE '%( SELECT auth.uid() AS uid)%' THEN '✅ Wrapped with AS uid'
    WHEN with_check LIKE '%auth.uid()%' THEN '❌ Not wrapped'
    WHEN with_check IS NULL THEN 'N/A'
    ELSE '✅ No auth.uid()'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Users can create activities',
    'Users can join invited tenants',
    'Authenticated users can view profiles',
    'Authenticated users can view tenants',
    'Authenticated users can manage leads'
  )
ORDER BY tablename, policyname;

-- 2. Check all policies for auth.uid() patterns
SELECT 
  COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%' AND qual NOT LIKE '%( SELECT auth.uid() AS uid)%') as unoptimized_qual,
  COUNT(*) FILTER (WHERE with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%' AND with_check NOT LIKE '%( SELECT auth.uid() AS uid)%') as unoptimized_with_check,
  COUNT(*) FILTER (WHERE (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(select auth.uid())%' OR qual LIKE '%( SELECT auth.uid() AS uid)%')) as optimized_qual,
  COUNT(*) FILTER (WHERE (with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(select auth.uid())%' OR with_check LIKE '%( SELECT auth.uid() AS uid)%')) as optimized_with_check
FROM pg_policies
WHERE schemaname = 'public';

-- 3. Check for custom auth functions that might be the issue
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual ~ 'auth\.[a-z_]+\(\)' OR with_check ~ 'auth\.[a-z_]+\(\)')
  AND tablename IN ('activities', 'user_tenants', 'profiles', 'tenants', 'leads')
ORDER BY tablename, policyname;

-- 4. Check get_user_tenant_id function
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'get_user_tenant_id'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Check for current_setting usage (another source of warnings)
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%current_setting%' THEN 'Uses current_setting in qual'
    WHEN with_check LIKE '%current_setting%' THEN 'Uses current_setting in with_check'
    ELSE 'No current_setting'
  END as current_setting_usage
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%current_setting%' OR with_check LIKE '%current_setting%')
ORDER BY tablename, policyname;