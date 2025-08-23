-- Check ALL webhook requirements in one query
WITH checks AS (
    SELECT 1 as order_num, 'Tenant exists?' as check_type, 
           CASE WHEN EXISTS (SELECT 1 FROM tenants WHERE id = '80496bff-b559-4b80-9102-3a84afdaa616')
                THEN 'YES' 
                ELSE 'NO - THIS IS THE PROBLEM!' 
           END as result
    UNION ALL
    SELECT 2, 'Anon can INSERT leads?',
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.table_privileges
               WHERE table_name = 'leads' 
               AND grantee = 'anon'
               AND privilege_type = 'INSERT'
           ) THEN 'YES' 
             ELSE 'NO - NEED TO GRANT INSERT!' 
           END
    UNION ALL
    SELECT 3, 'Anon can check tenants?',
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.table_privileges
               WHERE table_name = 'tenants' 
               AND grantee = 'anon'
               AND privilege_type = 'SELECT'
           ) THEN 'YES' 
             ELSE 'NO - NEED TO GRANT SELECT!' 
           END
    UNION ALL
    SELECT 4, 'Anon can read webhook_configs?',
           CASE WHEN EXISTS (
               SELECT 1 FROM information_schema.table_privileges
               WHERE table_name = 'webhook_configs' 
               AND grantee = 'anon'
               AND privilege_type = 'SELECT'
           ) THEN 'YES' 
             ELSE 'NO - NEED TO GRANT SELECT!' 
           END
    UNION ALL
    SELECT 5, 'INSERT policies on leads',
           COALESCE(string_agg(policyname, ', '), 'NONE')
    FROM pg_policies 
    WHERE tablename = 'leads' AND cmd = 'INSERT'
)
SELECT check_type, result 
FROM checks 
ORDER BY order_num;