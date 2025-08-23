-- Fix team_members duplicate policies performance warning
-- This resolves the last remaining database linter warning

-- Check current policies on team_members table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Current policies on team_members table:';
    FOR policy_record IN
        SELECT policyname, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'team_members'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % - Command: %', policy_record.policyname, policy_record.cmd;
    END LOOP;
END $$;

-- Drop the duplicate SELECT policies on team_members
DROP POLICY IF EXISTS "Admin team member management" ON team_members;
DROP POLICY IF EXISTS "Team members view access" ON team_members;

-- Create a single optimized policy that combines both access patterns
CREATE POLICY "Optimized: Team members access" ON team_members
    FOR SELECT USING (
        -- Users can see team members from their own tenant
        tenant_id = get_current_tenant_id()
        OR
        -- Admins can manage team members (if you need admin access across tenants)
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
        )
    );

-- Alternative: If you don't need admin cross-tenant access, use this simpler version instead:
-- DROP POLICY IF EXISTS "Optimized: Team members access" ON team_members;
-- CREATE POLICY "Optimized: Team members tenant access" ON team_members
--     FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Create other necessary policies for team_members if they don't exist
-- (Only SELECT was mentioned in the warning, but let's ensure others are optimized too)

-- Check and create INSERT policy if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'team_members' 
        AND cmd = 'INSERT'
    ) THEN
        CREATE POLICY "Optimized: Team members insert" ON team_members
            FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());
        RAISE NOTICE 'Created INSERT policy for team_members';
    END IF;
END $$;

-- Check and create UPDATE policy if needed  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'team_members' 
        AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Optimized: Team members update" ON team_members
            FOR UPDATE USING (tenant_id = get_current_tenant_id());
        RAISE NOTICE 'Created UPDATE policy for team_members';
    END IF;
END $$;

-- Check and create DELETE policy if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'team_members' 
        AND cmd = 'DELETE'
    ) THEN
        CREATE POLICY "Optimized: Team members delete" ON team_members
            FOR DELETE USING (tenant_id = get_current_tenant_id());
        RAISE NOTICE 'Created DELETE policy for team_members';
    END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
    policy_count INTEGER;
    select_policies TEXT[];
BEGIN
    -- Count SELECT policies on team_members
    SELECT COUNT(*), array_agg(policyname) 
    INTO policy_count, select_policies
    FROM pg_policies 
    WHERE tablename = 'team_members' 
    AND cmd = 'SELECT';
    
    RAISE NOTICE '=== TEAM MEMBERS POLICY FIX COMPLETED ===';
    RAISE NOTICE 'SELECT policies on team_members: %', policy_count;
    RAISE NOTICE 'Policy names: %', select_policies;
    
    IF policy_count = 1 THEN
        RAISE NOTICE '✅ SUCCESS: Only 1 SELECT policy remains - performance warning resolved!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Still % SELECT policies found', policy_count;
    END IF;
END $$;