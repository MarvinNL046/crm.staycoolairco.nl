-- Check remaining performance issues after optimization

-- Count duplicate policies per table/action
WITH policy_details AS (
    SELECT 
        tablename,
        cmd,
        COUNT(*) as policy_count,
        STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
)
SELECT 
    'PERFORMANCE CHECK' as analysis,
    tablename,
    cmd as action,
    policy_count,
    CASE 
        WHEN policy_count = 1 THEN '✅ Optimized'
        WHEN policy_count = 2 THEN '⚠️ Minor - 2 policies'
        ELSE '❌ Needs fix - ' || policy_count || ' policies'
    END as status,
    policy_names
FROM policy_details
WHERE policy_count > 1
ORDER BY policy_count DESC, tablename, cmd;

-- Summary statistics
SELECT 
    'SUMMARY' as report,
    COUNT(*) FILTER (WHERE policy_count = 1) as optimized_combos,
    COUNT(*) FILTER (WHERE policy_count = 2) as minor_issues,
    COUNT(*) FILTER (WHERE policy_count > 2) as major_issues,
    COUNT(*) as total_table_action_combos
FROM (
    SELECT tablename, cmd, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
) counts;