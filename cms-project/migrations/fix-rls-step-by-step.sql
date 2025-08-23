-- Step-by-step RLS Performance Fix
-- Run each section separately to fix the auth.uid() performance issues

-- SECTION 1: First, let's see what policies need fixing
SELECT 
  tablename,
  policyname,
  qual as current_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(select auth.uid())%'
ORDER BY tablename, policyname;

-- SECTION 2: Fix the duplicate indexes first (these are easy)
DROP INDEX IF EXISTS public.idx_api_keys_tenant;
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow;

-- SECTION 3: Example of manually fixing one policy
-- This example shows how to fix the "activities" table policies

-- Step 1: Drop the old policies
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

-- Step 2: Recreate with optimized version (using subquery)
-- For INSERT
CREATE POLICY "Users can create activities" ON public.activities
FOR INSERT TO public
WITH CHECK (user_id = (select auth.uid()));

-- For UPDATE
CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE TO public
USING (user_id = (select auth.uid()));

-- For DELETE
CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE TO public
USING (user_id = (select auth.uid()));

-- SECTION 4: Fix expenses table policies
-- Check current policies first
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'expenses' AND schemaname = 'public';

-- Then recreate them with optimization
-- (You'll need to adapt based on the actual policy logic shown above)

-- SECTION 5: Alternative approach - Update all at once for a specific table
-- This is a template you can use for each table:
/*
DO $$
DECLARE
  v_table_name text := 'your_table_name';  -- Change this
  v_policy record;
BEGIN
  -- Get all policies for the table
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
      AND tablename = v_table_name
      AND qual LIKE '%auth.uid()%'
  LOOP
    -- Drop the old policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                   v_policy.policyname, v_table_name);
    
    -- Recreate with optimized qual
    DECLARE
      v_new_qual text;
      v_new_check text;
      v_cmd_text text;
    BEGIN
      -- Replace auth.uid() with (select auth.uid())
      v_new_qual := replace(v_policy.qual, 'auth.uid()', '(select auth.uid())');
      
      -- Convert cmd to text
      v_cmd_text := CASE v_policy.cmd
        WHEN 'SELECT' THEN 'SELECT'
        WHEN 'INSERT' THEN 'INSERT'
        WHEN 'UPDATE' THEN 'UPDATE'
        WHEN 'DELETE' THEN 'DELETE'
        ELSE 'ALL'
      END;
      
      -- Handle WITH CHECK if exists
      IF v_policy.with_check IS NOT NULL THEN
        v_new_check := replace(v_policy.with_check, 'auth.uid()', '(select auth.uid())');
        
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s) WITH CHECK (%s)',
          v_policy.policyname,
          v_table_name,
          v_cmd_text,
          v_policy.roles,
          v_new_qual,
          v_new_check
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s)',
          v_policy.policyname,
          v_table_name,
          v_cmd_text,
          v_policy.roles,
          v_new_qual
        );
      END IF;
      
      RAISE NOTICE 'Fixed policy % on table %', v_policy.policyname, v_table_name;
    END;
  END LOOP;
END $$;
*/

-- SECTION 6: Verify fixes
-- Run this after fixing policies to see the status
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Optimized'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Needs optimization'
    ELSE '✅ No auth.uid() used'
  END as optimization_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'expenses', 'contacts', 'leads', 'invoices', 'appointments')
ORDER BY tablename, policyname;