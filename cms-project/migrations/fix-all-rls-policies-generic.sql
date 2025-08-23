-- Generic solution to fix ALL RLS policies with auth.uid() performance issues
-- This script will find and fix all policies automatically

BEGIN;

-- Create a function to fix all policies for a given table
CREATE OR REPLACE FUNCTION fix_table_policies(p_table_name text) 
RETURNS void AS $$
DECLARE
    v_policy record;
    v_new_qual text;
    v_new_with_check text;
    v_cmd text;
BEGIN
    -- Loop through all policies for this table
    FOR v_policy IN 
        SELECT 
            policyname,
            cmd,
            roles,
            permissive,
            qual,
            with_check
        FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename = p_table_name
          AND qual LIKE '%auth.uid()%'
          AND qual NOT LIKE '%(select auth.uid())%'
    LOOP
        -- Replace auth.uid() with (select auth.uid())
        v_new_qual := v_policy.qual;
        v_new_qual := regexp_replace(v_new_qual, '\bauth\.uid\(\)', '(select auth.uid())', 'g');
        
        -- Also fix WITH CHECK clause if it exists
        IF v_policy.with_check IS NOT NULL THEN
            v_new_with_check := v_policy.with_check;
            v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.uid\(\)', '(select auth.uid())', 'g');
        END IF;
        
        -- Drop the old policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                       v_policy.policyname, p_table_name);
        
        -- Recreate with the optimized version
        IF v_policy.with_check IS NOT NULL AND v_new_with_check IS NOT NULL THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
                v_policy.policyname,
                p_table_name,
                CASE WHEN v_policy.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
                v_policy.cmd,
                v_policy.roles,
                v_new_qual,
                v_new_with_check
            );
        ELSE
            EXECUTE format(
                'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s)',
                v_policy.policyname,
                p_table_name,
                CASE WHEN v_policy.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
                v_policy.cmd,
                v_policy.roles,
                v_new_qual
            );
        END IF;
        
        RAISE NOTICE 'Fixed policy % on table %', v_policy.policyname, p_table_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Get list of tables that need fixing
CREATE TEMP TABLE tables_to_fix AS
SELECT DISTINCT tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(select auth.uid())%';

-- Show which tables will be fixed
SELECT tablename, COUNT(*) as policies_to_fix 
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(select auth.uid())%'
GROUP BY tablename
ORDER BY tablename;

-- Fix all tables
DO $$
DECLARE
    v_table text;
BEGIN
    FOR v_table IN SELECT tablename FROM tables_to_fix
    LOOP
        PERFORM fix_table_policies(v_table);
    END LOOP;
END $$;

-- Also fix get_user_tenant_id function calls if needed
-- Some policies might benefit from wrapping this in a subquery too
DO $$
DECLARE
    v_policy record;
    v_new_qual text;
BEGIN
    FOR v_policy IN 
        SELECT DISTINCT
            tablename,
            policyname,
            qual
        FROM pg_policies
        WHERE schemaname = 'public'
          AND qual LIKE '%get_user_tenant_id()%'
          AND qual NOT LIKE '%(select get_user_tenant_id())%'
    LOOP
        v_new_qual := v_policy.qual;
        v_new_qual := regexp_replace(v_new_qual, '\bget_user_tenant_id\(\)', '(select get_user_tenant_id())', 'g');
        
        -- This is optional optimization, uncomment if you want to apply it:
        /*
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                       v_policy.policyname, v_policy.tablename);
        
        -- You'd need to recreate the policy here with all its properties
        -- This is more complex because we need to preserve all policy settings
        */
        
        RAISE NOTICE 'Policy % on table % uses get_user_tenant_id() - consider wrapping in subquery', 
                    v_policy.policyname, v_policy.tablename;
    END LOOP;
END $$;

-- Clean up
DROP FUNCTION IF EXISTS fix_table_policies(text);
DROP TABLE IF EXISTS tables_to_fix;

-- Final verification
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Optimized'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Needs optimization'
    ELSE '✅ No auth.uid()'
  END as status,
  CASE 
    WHEN qual LIKE '%get_user_tenant_id()%' 
         AND qual NOT LIKE '%(select get_user_tenant_id())%' 
    THEN '⚠️ Consider wrapping get_user_tenant_id() in subquery too'
    ELSE ''
  END as additional_optimization
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%' THEN 0
    ELSE 1
  END,
  tablename, 
  policyname;

COMMIT;