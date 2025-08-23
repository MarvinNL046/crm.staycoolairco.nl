-- Direct approach to fix the final issues

-- 1. First identify ALL policies and functions with auth.uid() issues
WITH auth_issues AS (
    SELECT 
        'policy' as type,
        schemaname,
        tablename,
        policyname,
        CASE 
            WHEN qual ~ 'auth\.uid\(\)(?!\s*\))' THEN 'qual'
            WHEN with_check ~ 'auth\.uid\(\)(?!\s*\))' THEN 'with_check'
        END as issue_location,
        qual,
        with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ~ 'auth\.uid\(\)(?!\s*\))' OR with_check ~ 'auth\.uid\(\)(?!\s*\))')
)
SELECT 
    type,
    tablename,
    policyname,
    issue_location,
    CASE 
        WHEN issue_location = 'qual' THEN LEFT(qual, 100) || '...'
        ELSE LEFT(with_check, 100) || '...'
    END as content_preview
FROM auth_issues
ORDER BY tablename, policyname;

-- 2. Get function issues
SELECT 
    'function' as type,
    nspname as schemaname,
    proname as function_name,
    LEFT(prosrc, 100) || '...' as content_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosrc ~ 'auth\.uid\(\)(?!\s*\))';

-- 3. Now let's fix them with a more aggressive approach
BEGIN;

-- Fix all policies with auth.uid() issues
DO $$
DECLARE
    pol RECORD;
    new_qual TEXT;
    new_with_check TEXT;
    drop_success BOOLEAN;
BEGIN
    -- Get all policies with issues
    FOR pol IN
        SELECT *
        FROM pg_policies
        WHERE schemaname = 'public'
          AND (qual ~ 'auth\.uid\(\)(?!\s*\))' OR with_check ~ 'auth\.uid\(\)(?!\s*\))')
    LOOP
        RAISE NOTICE 'Processing policy % on table %', pol.policyname, pol.tablename;
        
        -- Prepare new qual and with_check
        new_qual := pol.qual;
        new_with_check := pol.with_check;
        
        -- Replace all instances of auth.uid() that aren't already wrapped
        IF pol.qual ~ 'auth\.uid\(\)(?!\s*\))' THEN
            -- Replace auth.uid() with (SELECT auth.uid())
            new_qual := regexp_replace(pol.qual, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        END IF;
        
        IF pol.with_check IS NOT NULL AND pol.with_check ~ 'auth\.uid\(\)(?!\s*\))' THEN
            new_with_check := regexp_replace(pol.with_check, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        END IF;
        
        -- Drop the policy
        BEGIN
            EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
            drop_success := TRUE;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not drop policy % on %: %', pol.policyname, pol.tablename, SQLERRM;
            drop_success := FALSE;
        END;
        
        -- Only recreate if drop was successful
        IF drop_success THEN
            -- Recreate the policy based on command type
            IF pol.cmd = 'INSERT' AND pol.with_check IS NOT NULL THEN
                -- INSERT uses WITH CHECK
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s WITH CHECK (%s)',
                    pol.policyname,
                    pol.tablename,
                    pol.permissive,
                    pol.cmd,
                    array_to_string(string_to_array(trim(both '{}' from pol.roles::text), ','), ', '),
                    new_with_check
                );
            ELSIF pol.cmd IN ('SELECT', 'UPDATE', 'DELETE') OR pol.cmd = 'ALL' THEN
                -- These use USING
                IF pol.with_check IS NOT NULL THEN
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
            END IF;
            
            RAISE NOTICE 'Successfully recreated policy % on %', pol.policyname, pol.tablename;
        END IF;
    END LOOP;
END $$;

-- Fix all functions with auth.uid() issues
DO $$
DECLARE
    func RECORD;
    new_body TEXT;
BEGIN
    FOR func IN
        SELECT 
            p.oid,
            p.proname,
            p.prosrc,
            pg_get_function_identity_arguments(p.oid) as args,
            pg_get_function_result(p.oid) as returns,
            p.prolang,
            l.lanname,
            p.prosecdef,
            p.provolatile,
            p.proisstrict,
            p.procost,
            p.prorows
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = 'public'
          AND p.prosrc ~ 'auth\.uid\(\)(?!\s*\))'
    LOOP
        RAISE NOTICE 'Processing function %', func.proname;
        
        -- Replace auth.uid() with (SELECT auth.uid())
        new_body := regexp_replace(func.prosrc, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
        
        -- Drop and recreate
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func.proname, func.args);
            
            -- Recreate with all original settings
            EXECUTE format(
                'CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE %I %s %s %s COST %s %s AS %L',
                func.proname,
                func.args,
                func.returns,
                func.lanname,
                CASE WHEN func.prosecdef THEN 'SECURITY DEFINER' ELSE '' END,
                CASE 
                    WHEN func.provolatile = 'i' THEN 'IMMUTABLE'
                    WHEN func.provolatile = 's' THEN 'STABLE'
                    ELSE 'VOLATILE'
                END,
                CASE WHEN func.proisstrict THEN 'STRICT' ELSE '' END,
                func.procost,
                CASE WHEN func.prorows > 0 THEN format('ROWS %s', func.prorows) ELSE '' END,
                new_body
            );
            
            -- Set search path for security definer functions
            IF func.prosecdef THEN
                EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, auth', func.proname, func.args);
            END IF;
            
            RAISE NOTICE 'Successfully recreated function %', func.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not recreate function %: %', func.proname, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;

-- Final check
SELECT 
    'FINAL CHECK' as status,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prosrc ~ 'auth\.uid\(\)(?!\s*\))') as functions_with_unwrapped_auth_uid,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND qual ~ 'auth\.uid\(\)(?!\s*\))') as policies_qual_unwrapped,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND with_check ~ 'auth\.uid\(\)(?!\s*\))') as policies_check_unwrapped,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND (qual ~ 'auth\.uid\(\)(?!\s*\))' OR with_check ~ 'auth\.uid\(\)(?!\s*\))')) as total_policies_with_issues;