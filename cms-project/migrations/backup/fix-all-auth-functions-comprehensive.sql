-- Comprehensive fix for all auth-related performance issues

BEGIN;

-- 1. Fix get_user_tenant_id function
DROP FUNCTION IF EXISTS public.get_user_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant_id(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = (SELECT auth.uid())
$$;

-- 2. Fix any other functions that use auth.uid()
DO $$
DECLARE
    func_rec RECORD;
    new_body TEXT;
BEGIN
    FOR func_rec IN 
        SELECT 
            p.proname,
            p.oid,
            p.prosrc,
            pg_get_function_arguments(p.oid) as arguments,
            pg_get_function_result(p.oid) as result,
            p.prolang,
            l.lanname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
          AND p.prosrc LIKE '%auth.uid()%'
          AND p.prosrc NOT LIKE '%(SELECT auth.uid())%'
          AND p.proname != 'get_user_tenant_id'  -- We already fixed this
    LOOP
        -- Replace auth.uid() with (SELECT auth.uid())
        new_body := regexp_replace(func_rec.prosrc, '(?<![(\s])auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        
        -- Recreate the function with optimized body
        EXECUTE format(
            'CREATE OR REPLACE FUNCTION public.%I(%s) RETURNS %s LANGUAGE %s AS %L',
            func_rec.proname,
            func_rec.arguments,
            func_rec.result,
            func_rec.lanname,
            new_body
        );
        
        RAISE NOTICE 'Fixed function: %', func_rec.proname;
    END LOOP;
END $$;

-- 3. Fix all RLS policies that might have been recreated
DO $$
DECLARE
    policy_rec RECORD;
    new_qual TEXT;
    new_with_check TEXT;
    needs_update BOOLEAN;
BEGIN
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
          AND (
            (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%')
            OR 
            (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%')
          )
    LOOP
        needs_update := FALSE;
        new_qual := policy_rec.qual;
        new_with_check := policy_rec.with_check;
        
        -- Fix qual if needed
        IF policy_rec.qual LIKE '%auth.uid()%' AND policy_rec.qual NOT LIKE '%(SELECT auth.uid())%' THEN
            new_qual := regexp_replace(policy_rec.qual, '(?<![(\s])auth\.uid\(\)', '(SELECT auth.uid())', 'g');
            needs_update := TRUE;
        END IF;
        
        -- Fix with_check if needed
        IF policy_rec.with_check IS NOT NULL AND policy_rec.with_check LIKE '%auth.uid()%' AND policy_rec.with_check NOT LIKE '%(SELECT auth.uid())%' THEN
            new_with_check := regexp_replace(policy_rec.with_check, '(?<![(\s])auth\.uid\(\)', '(SELECT auth.uid())', 'g');
            needs_update := TRUE;
        END IF;
        
        IF needs_update THEN
            -- Drop and recreate the policy
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, policy_rec.tablename);
            
            -- Recreate based on command type
            IF policy_rec.cmd = 'INSERT' AND policy_rec.with_check IS NOT NULL THEN
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s WITH CHECK (%s)',
                    policy_rec.policyname,
                    policy_rec.tablename,
                    policy_rec.permissive,
                    policy_rec.cmd,
                    array_to_string(string_to_array(trim(both '{}' from policy_rec.roles::text), ','), ', '),
                    new_with_check
                );
            ELSIF policy_rec.with_check IS NOT NULL THEN
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
            ELSE
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

-- Verification
SELECT 
    'Functions' as check_type,
    COUNT(*) FILTER (WHERE prosrc LIKE '%auth.uid()%' AND prosrc NOT LIKE '%(SELECT auth.uid())%') as unoptimized,
    COUNT(*) FILTER (WHERE prosrc LIKE '%(SELECT auth.uid())%') as optimized
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'

UNION ALL

SELECT 
    'Policies - qual' as check_type,
    COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' AND qual NOT LIKE '%(select auth.uid())%') as unoptimized,
    COUNT(*) FILTER (WHERE qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(select auth.uid())%') as optimized
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Policies - with_check' as check_type,
    COUNT(*) FILTER (WHERE with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%') as unoptimized,
    COUNT(*) FILTER (WHERE with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(select auth.uid())%') as optimized
FROM pg_policies
WHERE schemaname = 'public';