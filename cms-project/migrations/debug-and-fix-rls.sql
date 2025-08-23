-- Debug and fix RLS policies
-- Let's first see exactly what's in the policies

-- STEP 1: Debug - see the exact policy definitions
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'activities' 
  AND schemaname = 'public'
  AND policyname IN ('Users can delete their own activities', 'Users can update their own activities');

-- STEP 2: Check if the policies actually exist in pg_policy
SELECT 
  pol.polname,
  pol.polcmd,
  pg_get_expr(pol.polqual, pol.polrelid) as qual_expr,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expr
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname = 'activities'
  AND pol.polname IN ('Users can delete their own activities', 'Users can update their own activities');

-- STEP 3: Force drop and recreate with explicit commands
-- First, ensure the policies are really dropped
DO $$
BEGIN
  -- Force drop
  EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities CASCADE';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities CASCADE';
  
  -- Wait a moment
  PERFORM pg_sleep(0.1);
  
  -- Recreate with exact syntax
  EXECUTE 'CREATE POLICY "Users can delete their own activities" ON public.activities AS PERMISSIVE FOR DELETE TO public USING (((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid()))))';
  
  EXECUTE 'CREATE POLICY "Users can update their own activities" ON public.activities AS PERMISSIVE FOR UPDATE TO public USING (((tenant_id = get_user_tenant_id()) AND (user_id = (SELECT auth.uid()))))';
  
  RAISE NOTICE 'Policies recreated';
END $$;

-- STEP 4: Verify the changes
SELECT 
  policyname,
  qual,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ Fixed - uppercase SELECT'
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Fixed - lowercase select'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Still needs fixing'
    ELSE '✅ No auth.uid()'
  END as status
FROM pg_policies
WHERE tablename = 'activities' 
  AND schemaname = 'public';

-- STEP 5: Alternative approach - use ALTER POLICY if available
-- Note: ALTER POLICY might not support changing the USING clause directly
-- So we'll stick with DROP and CREATE

-- STEP 6: Let's create a function that definitely works
CREATE OR REPLACE FUNCTION fix_auth_uid_in_policy(
  p_table_name text,
  p_policy_name text
) RETURNS void AS $$
DECLARE
  v_policy_def record;
  v_new_qual text;
  v_new_check text;
BEGIN
  -- Get current policy
  SELECT 
    cmd,
    qual,
    with_check,
    roles,
    permissive
  INTO v_policy_def
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename = p_table_name
    AND policyname = p_policy_name;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Policy % not found on table %', p_policy_name, p_table_name;
    RETURN;
  END IF;
  
  -- Fix the qual
  v_new_qual := v_policy_def.qual;
  -- Use word boundaries to ensure we only replace auth.uid() and not (select auth.uid())
  v_new_qual := regexp_replace(v_new_qual, '(?<!\(select )\bauth\.uid\(\)', '(SELECT auth.uid())', 'g');
  
  -- Fix with_check if exists
  IF v_policy_def.with_check IS NOT NULL THEN
    v_new_check := v_policy_def.with_check;
    v_new_check := regexp_replace(v_new_check, '(?<!\(select )\bauth\.uid\(\)', '(SELECT auth.uid())', 'g');
  END IF;
  
  -- Only proceed if changes were made
  IF v_new_qual != v_policy_def.qual OR 
     (v_policy_def.with_check IS NOT NULL AND v_new_check != v_policy_def.with_check) THEN
    
    -- Drop old policy
    EXECUTE format('DROP POLICY %I ON public.%I', p_policy_name, p_table_name);
    
    -- Recreate with new qual
    IF v_policy_def.with_check IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
        p_policy_name,
        p_table_name,
        v_policy_def.permissive,
        v_policy_def.cmd,
        array_to_string(string_to_array(trim(both '{}' from v_policy_def.roles), ','), ', '),
        v_new_qual,
        v_new_check
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s)',
        p_policy_name,
        p_table_name,
        v_policy_def.permissive,
        v_policy_def.cmd,
        array_to_string(string_to_array(trim(both '{}' from v_policy_def.roles), ','), ', '),
        v_new_qual
      );
    END IF;
    
    RAISE NOTICE 'Fixed policy % on table %', p_policy_name, p_table_name;
  ELSE
    RAISE NOTICE 'Policy % on table % already optimized or no auth.uid() found', p_policy_name, p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Use the function to fix specific policies
SELECT fix_auth_uid_in_policy('activities', 'Users can delete their own activities');
SELECT fix_auth_uid_in_policy('activities', 'Users can update their own activities');

-- Clean up
DROP FUNCTION IF EXISTS fix_auth_uid_in_policy(text, text);

-- Final check
SELECT 
  policyname,
  qual,
  CASE 
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ Fixed'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Still needs fixing'
    ELSE '✅ No auth.uid()'
  END as status
FROM pg_policies
WHERE tablename = 'activities' 
  AND schemaname = 'public';