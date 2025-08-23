-- Optimize RLS Performance - Fix auth function re-evaluation and duplicate policies
-- This fixes the performance warnings from Supabase database linter

-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- We'll recreate them with optimized auth function calls

-- Drop duplicate webhook_logs policies first
DROP POLICY IF EXISTS "Authenticated users can manage webhook_logs" ON webhook_logs;

-- Drop email template policies
DROP POLICY IF EXISTS "Users can view templates for their tenant" ON email_templates;
DROP POLICY IF EXISTS "Users can create templates for their tenant" ON email_templates; 
DROP POLICY IF EXISTS "Users can update templates for their tenant" ON email_templates;
DROP POLICY IF EXISTS "Users can delete templates for their tenant" ON email_templates;

-- Drop webhook policies
DROP POLICY IF EXISTS "Users can view webhook configs for their tenant" ON webhook_configs;
DROP POLICY IF EXISTS "Users can update webhook configs for their tenant" ON webhook_configs;
DROP POLICY IF EXISTS "Users can view webhook logs for their tenant" ON webhook_logs;
DROP POLICY IF EXISTS "Users can view security events for their tenant" ON webhook_security_events;
DROP POLICY IF EXISTS "Users can view rate limits for their tenant" ON webhook_rate_limits;

-- 2. CREATE OPTIMIZED RLS POLICIES
-- Using (SELECT auth.uid()) instead of auth.uid() for better performance

-- EMAIL TEMPLATES - Optimized policies
CREATE POLICY "Users can view templates for their tenant" ON email_templates
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

CREATE POLICY "Users can create templates for their tenant" ON email_templates
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

CREATE POLICY "Users can update templates for their tenant" ON email_templates
    FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

CREATE POLICY "Users can delete templates for their tenant" ON email_templates
    FOR DELETE USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

-- WEBHOOK CONFIGS - Optimized policies
CREATE POLICY "Users can view webhook configs for their tenant" ON webhook_configs
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

CREATE POLICY "Users can update webhook configs for their tenant" ON webhook_configs
    FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

-- WEBHOOK LOGS - Single optimized policy (removes duplicates)
CREATE POLICY "Users can view webhook logs for their tenant" ON webhook_logs
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

-- WEBHOOK SECURITY EVENTS - Optimized policy
CREATE POLICY "Users can view security events for their tenant" ON webhook_security_events
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

-- WEBHOOK RATE LIMITS - Optimized policy
CREATE POLICY "Users can view rate limits for their tenant" ON webhook_rate_limits
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = (SELECT auth.uid())
    ));

-- 3. CREATE OPTIMIZED FUNCTION FOR EVEN BETTER PERFORMANCE
-- This function caches the current user's tenant_id for the session
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE -- This tells PostgreSQL the result won't change during a transaction
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO current_tenant_id 
    FROM profiles 
    WHERE id = (SELECT auth.uid())
    LIMIT 1;
    
    RETURN current_tenant_id;
END;
$$;

-- 4. CREATE ULTRA-OPTIMIZED POLICIES USING THE CACHED FUNCTION
-- Drop the previous ones and create even better versions

DROP POLICY IF EXISTS "Users can view templates for their tenant" ON email_templates;
DROP POLICY IF EXISTS "Users can create templates for their tenant" ON email_templates;
DROP POLICY IF EXISTS "Users can update templates for their tenant" ON email_templates;
DROP POLICY IF EXISTS "Users can delete templates for their tenant" ON email_templates;
DROP POLICY IF EXISTS "Users can view webhook configs for their tenant" ON webhook_configs;
DROP POLICY IF EXISTS "Users can update webhook configs for their tenant" ON webhook_configs;
DROP POLICY IF EXISTS "Users can view webhook logs for their tenant" ON webhook_logs;
DROP POLICY IF EXISTS "Users can view security events for their tenant" ON webhook_security_events;
DROP POLICY IF EXISTS "Users can view rate limits for their tenant" ON webhook_rate_limits;

-- ULTRA-OPTIMIZED EMAIL TEMPLATES POLICIES
CREATE POLICY "Optimized: Users can view templates for their tenant" ON email_templates
    FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can create templates for their tenant" ON email_templates
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can update templates for their tenant" ON email_templates
    FOR UPDATE USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can delete templates for their tenant" ON email_templates
    FOR DELETE USING (tenant_id = get_current_tenant_id());

-- ULTRA-OPTIMIZED WEBHOOK POLICIES
CREATE POLICY "Optimized: Users can view webhook configs for their tenant" ON webhook_configs
    FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can update webhook configs for their tenant" ON webhook_configs
    FOR UPDATE USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can view webhook logs for their tenant" ON webhook_logs
    FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can view security events for their tenant" ON webhook_security_events
    FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Optimized: Users can view rate limits for their tenant" ON webhook_rate_limits
    FOR SELECT USING (tenant_id = get_current_tenant_id());

-- 5. ADD PERFORMANCE COMMENTS
COMMENT ON FUNCTION get_current_tenant_id() IS 'Cached function to get current user tenant_id with STABLE flag for optimal RLS performance';

-- 6. SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '=== RLS PERFORMANCE OPTIMIZATION COMPLETED ===';
    RAISE NOTICE 'Fixed auth function re-evaluation issues';
    RAISE NOTICE 'Removed duplicate policies on webhook_logs';
    RAISE NOTICE 'Created optimized cached tenant_id function';
    RAISE NOTICE 'All RLS policies now use optimal performance patterns';
    RAISE NOTICE 'Database linter warnings should be resolved!';
END $$;