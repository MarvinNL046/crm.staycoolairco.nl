-- Check critical permissions for webhooks

-- 1. CRITICAL: Does tenant exist?
SELECT 'Tenant exists?' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM tenants WHERE id = '80496bff-b559-4b80-9102-3a84afdaa616')
            THEN 'YES' 
            ELSE 'NO - THIS IS THE PROBLEM!' 
       END as result;

-- 2. CRITICAL: Can anon INSERT into leads?
SELECT 'Anon can INSERT leads?' as check_type,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.table_privileges
           WHERE table_name = 'leads' 
           AND grantee = 'anon'
           AND privilege_type = 'INSERT'
       ) THEN 'YES' 
         ELSE 'NO - NEED TO GRANT INSERT!' 
       END as result;

-- 3. CRITICAL: Can anon SELECT from tenants (for policy check)?
SELECT 'Anon can check tenants?' as check_type,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.table_privileges
           WHERE table_name = 'tenants' 
           AND grantee = 'anon'
           AND privilege_type = 'SELECT'
       ) THEN 'YES' 
         ELSE 'NO - NEED TO GRANT SELECT!' 
       END as result;

-- 4. CRITICAL: Can anon SELECT from webhook_configs?
SELECT 'Anon can read webhook_configs?' as check_type,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.table_privileges
           WHERE table_name = 'webhook_configs' 
           AND grantee = 'anon'
           AND privilege_type = 'SELECT'
       ) THEN 'YES' 
         ELSE 'NO - NEED TO GRANT SELECT!' 
       END as result;

-- 5. Show INSERT policies on leads
SELECT 'INSERT policies on leads' as check_type, 
       string_agg(policyname, ', ') as result
FROM pg_policies 
WHERE tablename = 'leads' AND cmd = 'INSERT';