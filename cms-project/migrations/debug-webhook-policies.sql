-- Debug webhook policies and permissions

-- Check all policies on leads table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY policyname;

-- Check if anon role has the right permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'leads' 
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Check if we have any blocking policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'leads' 
AND cmd = 'INSERT';

-- Test if policy allows insert for our tenant
DO $$
DECLARE
    test_tenant_id UUID := '80496bff-b559-4b80-9102-3a84afdaa616';
BEGIN
    -- Check if tenant exists
    IF EXISTS (SELECT 1 FROM tenants WHERE id = test_tenant_id) THEN
        RAISE NOTICE 'Tenant % exists', test_tenant_id;
    ELSE
        RAISE NOTICE 'Tenant % does NOT exist!', test_tenant_id;
    END IF;
    
    -- Check if our policy would allow insert
    IF EXISTS (
        SELECT 1 FROM tenants WHERE id = test_tenant_id
    ) THEN
        RAISE NOTICE 'Policy check would ALLOW insert for tenant %', test_tenant_id;
    ELSE
        RAISE NOTICE 'Policy check would DENY insert for tenant %', test_tenant_id;
    END IF;
END $$;