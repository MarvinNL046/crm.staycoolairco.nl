-- Fix webhook access to leads table
-- This allows webhooks to insert leads using the anon key

-- First check current policies on leads table
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Current policies on leads table:';
    FOR r IN SELECT policyname, cmd FROM pg_policies WHERE tablename = 'leads' ORDER BY policyname LOOP
        RAISE NOTICE 'Policy: % - Command: %', r.policyname, r.cmd;
    END LOOP;
END $$;

-- Create a secure policy for webhook lead insertion
-- This checks if the request has a valid tenant_id parameter
CREATE POLICY "Webhooks can insert leads with valid tenant" ON leads
    FOR INSERT 
    WITH CHECK (
        -- Allow insert if tenant_id is provided and exists
        tenant_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM tenants WHERE id = tenant_id
        )
    );

-- Alternative: If you want to restrict to specific webhook source
-- DROP POLICY IF EXISTS "Webhooks can insert leads with valid tenant" ON leads;
-- CREATE POLICY "Webhooks can insert leads from API" ON leads
--     FOR INSERT 
--     WITH CHECK (
--         -- Allow insert if it comes from webhook (has specific source)
--         tenant_id IS NOT NULL 
--         AND source IN ('WEBHOOK', 'API', 'WEBSITE')
--         AND EXISTS (
--             SELECT 1 FROM tenants WHERE id = tenant_id
--         )
--     );

-- Make sure RLS is enabled on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to anon role for webhook operations
GRANT INSERT ON leads TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== WEBHOOK LEADS ACCESS FIXED ===';
    RAISE NOTICE 'Created policy for webhook lead insertion';
    RAISE NOTICE 'Granted INSERT permission to anon role';
    RAISE NOTICE 'Webhooks should now be able to create leads!';
END $$;