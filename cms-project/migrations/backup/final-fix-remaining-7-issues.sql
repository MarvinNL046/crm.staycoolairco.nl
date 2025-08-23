-- Final fix for the last 7 auth.uid() issues

-- First, let's identify exactly what needs fixing
SELECT 'REMAINING FUNCTIONS WITH ISSUES:' as section;
SELECT 
    p.proname as function_name,
    LEFT(p.prosrc, 200) as function_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc LIKE '%auth.uid()%'
  AND p.prosrc NOT LIKE '%(SELECT auth.uid()%';

SELECT '' as blank1;
SELECT 'REMAINING POLICIES WITH QUAL ISSUES:' as section;
SELECT 
    tablename,
    policyname,
    LEFT(qual, 200) as qual_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(SELECT auth.uid()%'
ORDER BY tablename, policyname;

SELECT '' as blank2;
SELECT 'REMAINING POLICIES WITH WITH_CHECK ISSUES:' as section;
SELECT 
    tablename,
    policyname,
    LEFT(with_check, 200) as with_check_preview
FROM pg_policies
WHERE schemaname = 'public'
  AND with_check LIKE '%auth.uid()%'
  AND with_check NOT LIKE '%(SELECT auth.uid()%'
ORDER BY tablename, policyname;

-- Now fix them
BEGIN;

-- Fix the functions (we need to see what they are first)
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
            pg_get_function_identity_arguments(p.oid) as identity_args,
            pg_get_function_result(p.oid) as result_type,
            p.prosecdef as security_definer,
            p.provolatile,
            l.lanname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
          AND p.prosrc LIKE '%auth.uid()%'
          AND p.prosrc NOT LIKE '%(SELECT auth.uid()%'
    LOOP
        RAISE NOTICE 'Fixing function: %', func_rec.proname;
        
        -- Replace auth.uid() with (SELECT auth.uid())
        new_body := regexp_replace(func_rec.prosrc, '(?<![(\s]|SELECT\s)auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        
        -- Drop and recreate
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_rec.proname, func_rec.identity_args);
        
        EXECUTE format(
            'CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE %s %s %s AS %L',
            func_rec.proname,
            func_rec.identity_args,
            func_rec.result_type,
            func_rec.lanname,
            CASE WHEN func_rec.security_definer THEN 'SECURITY DEFINER' ELSE '' END,
            CASE 
                WHEN func_rec.provolatile = 'i' THEN 'IMMUTABLE'
                WHEN func_rec.provolatile = 's' THEN 'STABLE'
                ELSE 'VOLATILE'
            END,
            new_body
        );
        
        IF func_rec.security_definer THEN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, auth', func_rec.proname, func_rec.identity_args);
        END IF;
    END LOOP;
END $$;

-- Fix remaining policies
DO $$
DECLARE
    pol RECORD;
    new_qual TEXT;
    new_with_check TEXT;
BEGIN
    -- Fix policies with qual issues
    FOR pol IN
        SELECT *
        FROM pg_policies
        WHERE schemaname = 'public'
          AND qual LIKE '%auth.uid()%'
          AND qual NOT LIKE '%(SELECT auth.uid()%'
    LOOP
        new_qual := regexp_replace(pol.qual, '(?<![(\s]|SELECT\s)auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        
        IF pol.with_check IS NOT NULL THEN
            new_with_check := regexp_replace(pol.with_check, '(?<![(\s]|SELECT\s)auth\.uid\(\)', '(SELECT auth.uid())', 'g');
            EXECUTE format(
                'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
                pol.policyname,
                pol.tablename,
                pol.permissive,
                pol.cmd,
                array_to_string(string_to_array(trim(both '{}' from pol.roles::text), ','), ', '),
                new_qual,
                new_with_check
            );
        ELSE
            EXECUTE format(
                'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s)',
                pol.policyname,
                pol.tablename,
                pol.permissive,
                pol.cmd,
                array_to_string(string_to_array(trim(both '{}' from pol.roles::text), ','), ', '),
                new_qual
            );
        END IF;
        
        RAISE NOTICE 'Fixed policy % on %', pol.policyname, pol.tablename;
    END LOOP;
    
    -- Fix policies with with_check issues
    FOR pol IN
        SELECT *
        FROM pg_policies
        WHERE schemaname = 'public'
          AND with_check LIKE '%auth.uid()%'
          AND with_check NOT LIKE '%(SELECT auth.uid()%'
    LOOP
        new_with_check := regexp_replace(pol.with_check, '(?<![(\s]|SELECT\s)auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        
        -- For INSERT policies, use WITH CHECK
        IF pol.cmd = 'INSERT' THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s WITH CHECK (%s)',
                pol.policyname,
                pol.tablename,
                pol.permissive,
                pol.cmd,
                array_to_string(string_to_array(trim(both '{}' from pol.roles::text), ','), ', '),
                new_with_check
            );
        ELSE
            new_qual := regexp_replace(pol.qual, '(?<![(\s]|SELECT\s)auth\.uid\(\)', '(SELECT auth.uid())', 'g');
            EXECUTE format(
                'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
                pol.policyname,
                pol.tablename,
                pol.permissive,
                pol.cmd,
                array_to_string(string_to_array(trim(both '{}' from pol.roles::text), ','), ', '),
                new_qual,
                new_with_check
            );
        END IF;
        
        RAISE NOTICE 'Fixed policy % on % (with_check)', pol.policyname, pol.tablename;
    END LOOP;
END $$;

COMMIT;

-- Final verification - this should show all zeros
SELECT 
    'FINAL VERIFICATION' as status,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc LIKE '%auth.uid()%' 
     AND p.prosrc NOT LIKE '%(SELECT auth.uid()%') as functions_remaining,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual LIKE '%auth.uid()%' 
     AND qual NOT LIKE '%(SELECT auth.uid()%') as policies_qual_remaining,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check LIKE '%auth.uid()%' 
     AND with_check NOT LIKE '%(SELECT auth.uid()%') as policies_with_check_remaining,
    (SELECT COUNT(DISTINCT tablename || '_' || cmd) 
     FROM pg_policies 
     WHERE schemaname = 'public' 
     GROUP BY tablename, cmd 
     HAVING COUNT(*) > 1) as tables_with_multiple_policies;