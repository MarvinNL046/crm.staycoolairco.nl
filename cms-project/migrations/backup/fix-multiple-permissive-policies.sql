-- Fix multiple permissive policies performance issue on team_members table
-- Consolidate two SELECT policies into one for better performance

BEGIN;

-- First, let's see the current policies to understand the exact logic
-- This is for reference only - the actual policies should be:
-- 1. "Users can view own tenant team members" - FOR SELECT 
-- 2. "Admins can manage team members" - FOR ALL (which includes SELECT)

-- Drop the existing overlapping policies
DROP POLICY IF EXISTS "Users can view own tenant team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

-- Create a single consolidated SELECT policy
CREATE POLICY "Team members view access" ON public.team_members
    FOR SELECT TO authenticated
    USING (
        -- Users can view team members in their own tenant
        tenant_id = get_user_tenant_id()
        -- Note: Admin logic is now handled in the management policy below
    );

-- Create separate policies for management operations (INSERT, UPDATE, DELETE)
-- This keeps the admin logic separate and more performant
CREATE POLICY "Admin team member management" ON public.team_members
    FOR ALL TO authenticated
    USING (
        tenant_id = get_user_tenant_id() 
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('admin', 'owner')
        )
    )
    WITH CHECK (tenant_id = get_user_tenant_id());

COMMIT;

-- Verify the fix - check that we now have optimal policies
SELECT 
    'AFTER FIX: team_members policies' as status,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read access policy'
        WHEN cmd = 'ALL' THEN 'Admin management policy'
        ELSE 'Other policy'
    END as purpose,
    qual as condition
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'team_members'
ORDER BY cmd, policyname;

-- Double-check: Are there any other tables with multiple permissive policies?
WITH policy_counts AS (
    SELECT 
        tablename,
        cmd,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
    HAVING COUNT(*) > 1
)
SELECT 
    'Other tables with multiple permissive policies' as warning,
    tablename,
    cmd as operation,
    policy_count,
    'Consider consolidating these policies for better performance' as recommendation
FROM policy_counts
ORDER BY tablename, cmd;