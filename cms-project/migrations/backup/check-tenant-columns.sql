-- Check which tables have RLS enabled and whether they have tenant_id column

SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        ) THEN 'YES'
        ELSE 'NO'
    END as has_tenant_id,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.schemaname = 'public' 
            AND p.tablename = t.tablename
        ) THEN 'NO POLICIES'
        ELSE (
            SELECT COUNT(*)::text || ' policies' 
            FROM pg_policies p 
            WHERE p.schemaname = 'public' 
            AND p.tablename = t.tablename
        )
    END as policy_status,
    -- Get all column names for tables without tenant_id
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns c 
            WHERE c.table_schema = 'public' 
            AND c.table_name = t.tablename 
            AND c.column_name = 'tenant_id'
        ) THEN (
            SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = t.tablename
        )
        ELSE ''
    END as columns_list
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.schemaname = 'public' 
        AND p.tablename = t.tablename
    )
ORDER BY has_tenant_id DESC, t.tablename;