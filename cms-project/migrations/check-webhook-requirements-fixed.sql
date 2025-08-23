-- Check webhook requirements

-- 1. Check if tenant exists
SELECT 
    id,
    name,
    created_at
FROM tenants 
WHERE id = '80496bff-b559-4b80-9102-3a84afdaa616';

-- 2. Check anon role permissions on leads table
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'leads' 
AND grantee = 'anon'
ORDER BY privilege_type;

-- 3. Check if there are any other policies that might block
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY cmd, policyname;

-- 4. Check webhook_configs table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'webhook_configs' 
AND grantee = 'anon'
ORDER BY privilege_type;

-- 5. Check if we need to grant SELECT on tenants table for the policy check
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'tenants' 
AND grantee = 'anon'
ORDER BY privilege_type;

-- 6. Check webhook logs and rate limits permissions
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('webhook_logs', 'webhook_rate_limits', 'webhook_security_events')
AND grantee = 'anon'
ORDER BY table_name, privilege_type;