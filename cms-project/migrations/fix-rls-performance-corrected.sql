-- Corrected version: Fix RLS Performance Warnings
-- This version uses the correct column names from pg_policies view

BEGIN;

-- Step 1: Analyze current policies that need fixing
WITH policy_analysis AS (
  SELECT 
    schemaname,
    tablename,
    policyname,
    qual as policy_expression,
    cmd,
    roles,
    permissive
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      qual LIKE '%auth.uid()%'
      OR qual LIKE '%auth.jwt()%'
      OR qual LIKE '%auth.role()%'
    )
    AND NOT qual LIKE '%(select auth.%'
)
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN policy_expression LIKE '%auth.uid()%' THEN 'Uses auth.uid() - needs fixing'
    WHEN policy_expression LIKE '%auth.jwt()%' THEN 'Uses auth.jwt() - needs fixing'
    WHEN policy_expression LIKE '%auth.role()%' THEN 'Uses auth.role() - needs fixing'
  END as issue,
  policy_expression
FROM policy_analysis
ORDER BY tablename, policyname;

-- Step 2: Fix policies for each table
-- We'll need to recreate policies because we can't directly update them

-- Function to recreate a policy with optimized auth calls
CREATE OR REPLACE FUNCTION fix_policy_auth_calls(
  p_table text,
  p_policy text
) RETURNS void AS $$
DECLARE
  v_policy_def record;
  v_new_qual text;
  v_new_with_check text;
  v_roles text[];
  v_cmd_char char;
  v_cmd_text text;
BEGIN
  -- Get the current policy details from pg_policy
  SELECT 
    pol.polcmd,
    pol.polpermissive,
    pol.polroles::oid[]::regrole[]::text[],
    pg_get_expr(pol.polqual, pol.polrelid, true) as qual_expr,
    pg_get_expr(pol.polwithcheck, pol.polrelid, true) as check_expr
  INTO v_policy_def
  FROM pg_policy pol
  JOIN pg_class c ON pol.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND c.relname = p_table
    AND pol.polname = p_policy;

  IF NOT FOUND THEN
    RAISE NOTICE 'Policy % not found on table %', p_policy, p_table;
    RETURN;
  END IF;

  -- Convert polcmd to command text
  v_cmd_char := v_policy_def.polcmd;
  v_cmd_text := CASE v_cmd_char
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    ELSE 'ALL'
  END;

  -- Replace auth functions with subqueries
  v_new_qual := v_policy_def.qual_expr;
  v_new_qual := regexp_replace(v_new_qual, '\bauth\.uid\(\)', '(select auth.uid())', 'g');
  v_new_qual := regexp_replace(v_new_qual, '\bauth\.jwt\(\)', '(select auth.jwt())', 'g');
  v_new_qual := regexp_replace(v_new_qual, '\bauth\.role\(\)', '(select auth.role())', 'g');

  -- Also fix WITH CHECK if it exists
  IF v_policy_def.check_expr IS NOT NULL THEN
    v_new_with_check := v_policy_def.check_expr;
    v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.uid\(\)', '(select auth.uid())', 'g');
    v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.jwt\(\)', '(select auth.jwt())', 'g');
    v_new_with_check := regexp_replace(v_new_with_check, '\bauth\.role\(\)', '(select auth.role())', 'g');
  END IF;

  -- Only recreate if changes were made
  IF v_new_qual != v_policy_def.qual_expr OR 
     (v_new_with_check IS NOT NULL AND v_new_with_check != v_policy_def.check_expr) THEN
    
    -- Drop the old policy
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_policy, p_table);
    
    -- Recreate with optimized version
    v_roles := v_policy_def.polroles;
    
    IF v_new_with_check IS NOT NULL THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
        p_policy,
        p_table,
        CASE WHEN v_policy_def.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
        v_cmd_text,
        array_to_string(v_roles, ', '),
        v_new_qual,
        v_new_with_check
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s)',
        p_policy,
        p_table,
        CASE WHEN v_policy_def.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
        v_cmd_text,
        array_to_string(v_roles, ', '),
        v_new_qual
      );
    END IF;
    
    RAISE NOTICE 'Fixed policy % on table %', p_policy, p_table;
  ELSE
    RAISE NOTICE 'Policy % on table % does not need fixing', p_policy, p_table;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Fix policies for the most important tables first
-- These are the tables mentioned in your warnings

-- Activities table
SELECT fix_policy_auth_calls('activities', 'Users can create activities');
SELECT fix_policy_auth_calls('activities', 'Users can update their own activities');
SELECT fix_policy_auth_calls('activities', 'Users can delete their own activities');

-- Expenses table
SELECT fix_policy_auth_calls('expenses', 'Users can update their created expenses');
SELECT fix_policy_auth_calls('expenses', 'Admins can manage all expenses');

-- Contacts table
SELECT fix_policy_auth_calls('contacts', 'Authenticated users can manage contacts');

-- Leads table
SELECT fix_policy_auth_calls('leads', 'Authenticated users can manage leads');

-- Invoices table
SELECT fix_policy_auth_calls('invoices', 'Authenticated users can manage invoices');

-- Appointments table
SELECT fix_policy_auth_calls('appointments', 'Authenticated users can manage appointments');

-- Step 4: Clean up
DROP FUNCTION IF EXISTS fix_policy_auth_calls(text, text);

-- Step 5: Verify the fixes
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Fixed'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Still needs fixing'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'activities', 'expenses', 'contacts', 'leads', 
    'invoices', 'appointments'
  )
ORDER BY tablename, policyname;

COMMIT;