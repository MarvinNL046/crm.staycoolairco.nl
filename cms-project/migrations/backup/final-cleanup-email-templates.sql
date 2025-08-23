-- Final cleanup for email_templates table to remove last duplicate policies

BEGIN;

-- Show current policies on email_templates
SELECT 
    'BEFORE CLEANUP' as stage,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'email_templates'
ORDER BY policyname;

-- Drop the duplicate "Optimized:" policies, keep only tenant_ policies
DROP POLICY IF EXISTS "Optimized: Users can view templates for their tenant" ON public.email_templates;
DROP POLICY IF EXISTS "Optimized: Users can create templates for their tenant" ON public.email_templates;
DROP POLICY IF EXISTS "Optimized: Users can update templates for their tenant" ON public.email_templates;
DROP POLICY IF EXISTS "Optimized: Users can delete templates for their tenant" ON public.email_templates;

-- Verify cleanup
SELECT 
    'AFTER CLEANUP' as stage,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'email_templates'
ORDER BY policyname;

COMMIT;

-- Final performance check
WITH policy_counts AS (
    SELECT 
        tablename,
        cmd,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
)
SELECT 
    'FINAL PERFORMANCE STATUS' as check,
    COUNT(*) as tables_with_duplicate_policies,
    CASE 
        WHEN COUNT(*) = 0 THEN '🎉 FULLY OPTIMIZED - No duplicate policies!'
        ELSE '⚠️ Still ' || COUNT(*) || ' table/action combos with duplicates'
    END as status
FROM policy_counts;

-- Verify security is maintained
SELECT 
    'SECURITY VERIFICATION' as check,
    COUNT(*) FILTER (WHERE policy_count = 0) as tables_without_policies,
    COUNT(*) FILTER (WHERE policy_count > 0) as tables_with_policies,
    CASE 
        WHEN COUNT(*) FILTER (WHERE policy_count = 0) = 0 THEN '✅ All tables secured'
        ELSE '❌ ' || COUNT(*) FILTER (WHERE policy_count = 0) || ' tables without policies!'
    END as security_status
FROM (
    SELECT 
        t.table_name,
        COUNT(p.policyname) as policy_count
    FROM information_schema.tables t
    LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
    WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns c 
            WHERE c.table_schema = t.table_schema 
            AND c.table_name = t.table_name 
            AND c.column_name = 'tenant_id'
        )
    GROUP BY t.table_name
) policy_summary;