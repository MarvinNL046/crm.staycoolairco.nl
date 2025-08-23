-- Check current status of the 4 dangerous policies identified earlier
-- These were allowing cross-tenant access

SELECT 
    'Current status of dangerous policies' as check_type,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual = 'true' THEN '🚨 STILL ALLOWS EVERYONE!'
        WHEN qual LIKE '%tenant_id = get_user_tenant_id()%' THEN '✅ Fixed - Proper tenant isolation'
        WHEN qual LIKE '%auth.uid()%' AND qual LIKE '%tenant_id%' THEN '✅ Fixed - User + tenant isolation'
        WHEN qual LIKE '%super_admin%' THEN '✅ Fixed - Super admin only'
        ELSE '⚠️  Check this policy'
    END as status,
    qual as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('campaign_metrics', 'pipeline_stages', 'profiles', 'workflow_templates')
ORDER BY 
    CASE 
        WHEN qual = 'true' THEN 1  -- Show dangerous ones first
        ELSE 2
    END,
    tablename, policyname;

-- Also check if workflow_templates has tenant_id column
SELECT 
    'workflow_templates structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'workflow_templates'
ORDER BY ordinal_position;