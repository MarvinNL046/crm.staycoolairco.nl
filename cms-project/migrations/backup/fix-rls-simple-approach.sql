-- Simplest approach: Fix one table at a time
-- Start with this to test, then continue with others

-- Test with activities table first
BEGIN;

-- Check current policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'activities' 
  AND schemaname = 'public';

-- Fix the two activities policies
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
CREATE POLICY "Users can delete their own activities" ON public.activities
FOR DELETE 
TO public
USING (
  (tenant_id = get_user_tenant_id()) 
  AND 
  (user_id = (select auth.uid()))
);

DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
CREATE POLICY "Users can update their own activities" ON public.activities
FOR UPDATE 
TO public
USING (
  (tenant_id = get_user_tenant_id()) 
  AND 
  (user_id = (select auth.uid()))
);

-- Verify the fix
SELECT 
  policyname,
  CASE 
    WHEN qual LIKE '%(select auth.uid())%' THEN '✅ Fixed'
    WHEN qual LIKE '%auth.uid()%' THEN '❌ Needs fixing'
    ELSE '✅ OK'
  END as status
FROM pg_policies 
WHERE tablename = 'activities' 
  AND schemaname = 'public';

COMMIT;

-- If the above works, continue with the next table:
/*
BEGIN;

-- Expenses table
DROP POLICY IF EXISTS "Users can update their created expenses" ON public.expenses;
CREATE POLICY "Users can update their created expenses" ON public.expenses
FOR UPDATE 
TO public
USING (
  (tenant_id = get_user_tenant_id()) 
  AND 
  (created_by = (select auth.uid()))
);

-- Continue with other policies...

COMMIT;
*/