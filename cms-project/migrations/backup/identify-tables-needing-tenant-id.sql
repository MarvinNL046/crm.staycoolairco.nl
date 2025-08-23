-- Identify which business tables need tenant_id added for multi-tenant isolation

SELECT 
    t.table_name,
    CASE 
        -- Tables that should definitely have tenant_id
        WHEN t.table_name IN ('analytics_events', 'api_keys', 'system_audit_log') 
            THEN '❌ CRITICAL - Add tenant_id NOW'
        
        -- Configuration tables that might be shared
        WHEN t.table_name LIKE '%_config' OR t.table_name LIKE 'config_%' 
            THEN '✅ OK - Shared configuration'
        
        -- User/tenant management tables
        WHEN t.table_name IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members') 
            THEN '✅ OK - User/Tenant management'
            
        -- Any other table is likely business data that needs tenant_id
        ELSE '❌ NEEDS tenant_id for isolation'
    END as action_needed,
    
    -- Check if table has any foreign keys that might indicate tenant relationship
    (SELECT COUNT(*) FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu 
     ON tc.constraint_name = kcu.constraint_name
     WHERE tc.table_schema = 'public' 
     AND tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_name = t.table_name) as foreign_key_count,
     
    -- Check if table has created_by or similar user reference
    (SELECT COUNT(*) FROM information_schema.columns c
     WHERE c.table_schema = 'public'
     AND c.table_name = t.table_name
     AND c.column_name IN ('created_by', 'user_id', 'owner_id', 'assigned_to')) as has_user_reference
     
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns c 
        WHERE c.table_schema = t.table_schema 
        AND c.table_name = t.table_name 
        AND c.column_name = 'tenant_id'
    )
ORDER BY 
    CASE 
        WHEN t.table_name IN ('profiles', 'tenants', 'super_admins', 'tenant_users', 'user_tenants', 'team_members') THEN 3
        WHEN t.table_name LIKE '%_config' OR t.table_name LIKE 'config_%' THEN 2
        ELSE 1
    END,
    t.table_name;