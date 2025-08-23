-- Fix duplicate policies by removing the duplicates

BEGIN;

-- Remove duplicate policies (keep the one with underscores in the name)
DO $$
DECLARE
    dup RECORD;
BEGIN
    -- Find all tables with duplicate policies
    FOR dup IN
        SELECT DISTINCT tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND policyname LIKE 'Authenticated users can manage %'
        GROUP BY tablename, cmd
        HAVING COUNT(*) > 1
    LOOP
        -- Drop the policy with spaces/capitals in the description
        EXECUTE format(
            'DROP POLICY IF EXISTS "Authenticated users can manage %s" ON public.%I',
            REPLACE(dup.tablename, '_', ' '),
            dup.tablename
        );
        
        -- Also try with title case
        EXECUTE format(
            'DROP POLICY IF EXISTS "Authenticated users can manage %s" ON public.%I',
            REPLACE(INITCAP(REPLACE(dup.tablename, '_', ' ')), ' ', ' '),
            dup.tablename
        );
        
        -- For specific cases with different naming
        IF dup.tablename = 'api_keys' THEN
            EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage API keys" ON public.api_keys';
        ELSIF dup.tablename = 'btw_percentages' THEN
            EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage BTW percentages" ON public.btw_percentages';
        END IF;
        
        RAISE NOTICE 'Removed duplicate policies for %', dup.tablename;
    END LOOP;
END $$;

-- Let's also check and fix the consolidated policies from earlier
-- Remove old policies that should have been consolidated
DROP POLICY IF EXISTS "Only super admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Only super admins can view platform settings" ON public.platform_settings;

DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.system_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.system_audit_log;

DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;

DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.tenant_users;

DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view their tenant's expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their created expenses" ON public.expenses;

COMMIT;

-- Now let's do a comprehensive check of what's left
SELECT 'CURRENT POLICY COUNT BY TABLE:' as section;
SELECT 
    tablename,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
    STRING_AGG(DISTINCT policyname, ' | ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 1 OR tablename IN (
    'activities', 'profiles', 'tenants', 'user_tenants', 
    'platform_settings', 'super_admins', 'system_audit_log'
)
ORDER BY tablename;

-- Check remaining auth.uid() issues
SELECT '' as blank;
SELECT 'REMAINING AUTH.UID() ISSUES:' as section;
SELECT 
    'Total' as category,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid()%') as functions,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid()%') as policies_qual,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid()%') as policies_with_check;