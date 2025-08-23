-- Complete fix for all RLS performance warnings
-- This addresses all specific policies mentioned in the warnings

BEGIN;

-- First, let's check what policies need fixing
DO $$
DECLARE
    policy_rec RECORD;
    new_qual TEXT;
    new_with_check TEXT;
BEGIN
    -- Loop through all policies that need fixing
    FOR policy_rec IN 
        SELECT 
            tablename,
            policyname,
            cmd,
            qual,
            with_check,
            roles,
            permissive
        FROM pg_policies
        WHERE schemaname = 'public'
          AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
          AND qual NOT LIKE '%(SELECT auth.uid())%'
          AND qual NOT LIKE '%(select auth.uid())%'
          AND qual NOT LIKE '%( SELECT auth.uid() AS uid)%'
    LOOP
        -- Fix the qual expression
        new_qual := policy_rec.qual;
        -- Replace auth.uid() with (SELECT auth.uid()), but only if not already wrapped
        new_qual := regexp_replace(new_qual, '(?<![(\s])auth\.uid\(\)(?!\s*AS)', '(SELECT auth.uid())', 'g');
        
        -- Fix the with_check expression if it exists
        new_with_check := policy_rec.with_check;
        IF new_with_check IS NOT NULL THEN
            new_with_check := regexp_replace(new_with_check, '(?<![(\s])auth\.uid\(\)(?!\s*AS)', '(SELECT auth.uid())', 'g');
        END IF;
        
        -- Only update if something changed
        IF new_qual != policy_rec.qual OR (policy_rec.with_check IS NOT NULL AND new_with_check != policy_rec.with_check) THEN
            -- Drop the old policy
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, policy_rec.tablename);
            
            -- Recreate with optimized version
            IF policy_rec.with_check IS NOT NULL AND policy_rec.cmd != 'SELECT' THEN
                -- Policy has both USING and WITH CHECK
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
                    policy_rec.policyname,
                    policy_rec.tablename,
                    policy_rec.permissive,
                    policy_rec.cmd,
                    array_to_string(string_to_array(trim(both '{}' from policy_rec.roles::text), ','), ', '),
                    new_qual,
                    new_with_check
                );
            ELSIF policy_rec.cmd IN ('INSERT') AND policy_rec.with_check IS NULL THEN
                -- INSERT policies use WITH CHECK
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s WITH CHECK (%s)',
                    policy_rec.policyname,
                    policy_rec.tablename,
                    policy_rec.permissive,
                    policy_rec.cmd,
                    array_to_string(string_to_array(trim(both '{}' from policy_rec.roles::text), ','), ', '),
                    new_qual
                );
            ELSE
                -- Regular USING policies
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s)',
                    policy_rec.policyname,
                    policy_rec.tablename,
                    policy_rec.permissive,
                    policy_rec.cmd,
                    array_to_string(string_to_array(trim(both '{}' from policy_rec.roles::text), ','), ', '),
                    new_qual
                );
            END IF;
            
            RAISE NOTICE 'Fixed policy % on table %', policy_rec.policyname, policy_rec.tablename;
        END IF;
    END LOOP;
END $$;

COMMIT;

-- Now handle the multiple permissive policies issue
BEGIN;

-- Fix expenses table
DO $$
BEGIN
    -- Check if we have multiple policies for the same action
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'expenses' 
        AND schemaname = 'public' 
        AND cmd = 'SELECT' 
        GROUP BY cmd 
        HAVING COUNT(*) > 1
    ) THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.expenses;
        DROP POLICY IF EXISTS "Users can view their tenant's expenses" ON public.expenses;
        DROP POLICY IF EXISTS "Users can create expenses" ON public.expenses;
        DROP POLICY IF EXISTS "Users can update their created expenses" ON public.expenses;
        
        -- Create consolidated policies
        CREATE POLICY "Users can view expenses" ON public.expenses
        AS PERMISSIVE FOR SELECT TO public
        USING (tenant_id = get_user_tenant_id());
        
        CREATE POLICY "Users can create expenses" ON public.expenses
        AS PERMISSIVE FOR INSERT TO public
        WITH CHECK (tenant_id = get_user_tenant_id());
        
        CREATE POLICY "Users can update own expenses" ON public.expenses
        AS PERMISSIVE FOR UPDATE TO public
        USING (
            (tenant_id = get_user_tenant_id()) AND 
            (
                (created_by = (SELECT auth.uid())) OR
                EXISTS (
                    SELECT 1
                    FROM profiles
                    WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
                )
            )
        );
        
        CREATE POLICY "Admins can delete expenses" ON public.expenses
        AS PERMISSIVE FOR DELETE TO public
        USING (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
    END IF;
END $$;

-- Fix platform_settings table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'platform_settings' 
        AND schemaname = 'public' 
        AND cmd = 'SELECT' 
        GROUP BY cmd 
        HAVING COUNT(*) > 1
    ) THEN
        DROP POLICY IF EXISTS "Only super admins can manage platform settings" ON public.platform_settings;
        DROP POLICY IF EXISTS "Only super admins can view platform settings" ON public.platform_settings;
        
        CREATE POLICY "Super admins full access" ON public.platform_settings
        AS PERMISSIVE FOR ALL TO public
        USING (EXISTS ( 
            SELECT 1
            FROM super_admins
            WHERE (super_admins.user_id = (SELECT auth.uid()))
        ));
    END IF;
END $$;

-- Fix system_audit_log table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'system_audit_log' 
        AND schemaname = 'public' 
        AND cmd = 'SELECT' 
        GROUP BY cmd 
        HAVING COUNT(*) > 1
    ) THEN
        DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.system_audit_log;
        DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.system_audit_log;
        
        CREATE POLICY "View audit logs" ON public.system_audit_log
        AS PERMISSIVE FOR SELECT TO public
        USING (
            (actor_id = (SELECT auth.uid())) OR
            EXISTS (
                SELECT 1
                FROM super_admins
                WHERE (super_admins.user_id = (SELECT auth.uid()))
            )
        );
    END IF;
END $$;

-- Fix team_members table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'team_members' 
        AND schemaname = 'public' 
        AND cmd = 'SELECT' 
        GROUP BY cmd 
        HAVING COUNT(*) > 1
    ) THEN
        DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
        DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;
        
        CREATE POLICY "View team members" ON public.team_members
        AS PERMISSIVE FOR SELECT TO public
        USING (tenant_id = get_user_tenant_id());
        
        CREATE POLICY "Admins manage team members" ON public.team_members
        AS PERMISSIVE FOR INSERT TO public
        WITH CHECK (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
        
        CREATE POLICY "Admins update team members" ON public.team_members
        AS PERMISSIVE FOR UPDATE TO public
        USING (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
        
        CREATE POLICY "Admins delete team members" ON public.team_members
        AS PERMISSIVE FOR DELETE TO public
        USING (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
    END IF;
END $$;

-- Fix tenant_users table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'tenant_users' 
        AND schemaname = 'public' 
        AND cmd = 'SELECT' 
        GROUP BY cmd 
        HAVING COUNT(*) > 1
    ) THEN
        DROP POLICY IF EXISTS "Admins can manage tenant users" ON public.tenant_users;
        DROP POLICY IF EXISTS "Users can view their tenant associations" ON public.tenant_users;
        
        CREATE POLICY "View tenant users" ON public.tenant_users
        AS PERMISSIVE FOR SELECT TO public
        USING ((tenant_id = get_user_tenant_id()) OR (user_id = (SELECT auth.uid())));
        
        CREATE POLICY "Admins manage tenant users" ON public.tenant_users
        AS PERMISSIVE FOR INSERT TO public
        WITH CHECK (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
        
        CREATE POLICY "Admins update tenant users" ON public.tenant_users
        AS PERMISSIVE FOR UPDATE TO public
        USING (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
        
        CREATE POLICY "Admins delete tenant users" ON public.tenant_users
        AS PERMISSIVE FOR DELETE TO public
        USING (
            (tenant_id = get_user_tenant_id()) AND 
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['admin'::character varying, 'owner'::character varying])::text[])))
            )
        );
    END IF;
END $$;

COMMIT;

-- Fix duplicate indexes
BEGIN;

-- Check and drop duplicate indexes
DO $$
BEGIN
    -- Fix api_keys table duplicates
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'api_keys' AND indexname = 'idx_api_keys_tenant') THEN
        DROP INDEX IF EXISTS idx_api_keys_tenant;
        RAISE NOTICE 'Dropped duplicate index idx_api_keys_tenant';
    END IF;
    
    -- Fix workflow_executions table duplicates
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'workflow_executions' AND indexname = 'idx_workflow_executions_workflow') THEN
        DROP INDEX IF EXISTS idx_workflow_executions_workflow;
        RAISE NOTICE 'Dropped duplicate index idx_workflow_executions_workflow';
    END IF;
END $$;

COMMIT;

-- Final verification
SELECT 
  'Final Summary' as report_type,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE schemaname = 'public' 
     AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid())%' 
     AND qual NOT LIKE '%(select auth.uid())%' 
     AND qual NOT LIKE '%( SELECT auth.uid() AS uid)%'
  ) as unoptimized_auth_uid_policies,
  (SELECT COUNT(DISTINCT tablename || '_' || cmd) 
   FROM pg_policies 
   WHERE schemaname = 'public' 
     AND permissive = 'PERMISSIVE' 
   GROUP BY tablename, cmd 
   HAVING COUNT(*) > 1
  ) as tables_with_multiple_policies,
  (SELECT COUNT(*) 
   FROM (
     SELECT tablename, SUBSTRING(indexdef FROM '\((.*?)\)') as cols 
     FROM pg_indexes 
     WHERE schemaname = 'public' 
     GROUP BY tablename, cols 
     HAVING COUNT(*) > 1
   ) t
  ) as duplicate_index_sets;