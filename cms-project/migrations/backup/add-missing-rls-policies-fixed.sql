-- Add missing RLS policies for tables that have RLS enabled but no policies
-- This script handles both tables with and without tenant_id columns

BEGIN;

-- ========================================
-- Tables WITH tenant_id column
-- ========================================

-- 1. Activities table
CREATE POLICY "Users can view own tenant activities" ON public.activities
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create activities in own tenant" ON public.activities
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_user_tenant_id() AND user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own activities" ON public.activities
    FOR UPDATE TO authenticated
    USING (tenant_id = get_user_tenant_id() AND user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own activities" ON public.activities
    FOR DELETE TO authenticated
    USING (tenant_id = get_user_tenant_id() AND user_id = (SELECT auth.uid()));

-- 2. Analytics events table
CREATE POLICY "Users can view own tenant analytics" ON public.analytics_events
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create analytics events" ON public.analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 3. Automation executions
CREATE POLICY "Users can view own tenant automation executions" ON public.automation_executions
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

-- 4. Automation triggers
CREATE POLICY "Users can manage own tenant automation triggers" ON public.automation_triggers
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 5. Automations
CREATE POLICY "Users can manage own tenant automations" ON public.automations
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 6. Call logs
CREATE POLICY "Users can manage own tenant call logs" ON public.call_logs
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 7. Deals
CREATE POLICY "Users can manage own tenant deals" ON public.deals
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 8. Expenses
CREATE POLICY "Users can manage own tenant expenses" ON public.expenses
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 9. Integrations
CREATE POLICY "Users can manage own tenant integrations" ON public.integrations
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 10. Invoice sequences
CREATE POLICY "Users can view own tenant invoice sequences" ON public.invoice_sequences
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update own tenant invoice sequences" ON public.invoice_sequences
    FOR UPDATE TO authenticated
    USING (tenant_id = get_user_tenant_id());

-- 11. Message outbox
CREATE POLICY "Users can manage own tenant messages" ON public.message_outbox
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 12. Message templates
CREATE POLICY "Users can manage own tenant message templates" ON public.message_templates
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 13. Profiles
CREATE POLICY "Users can view profiles in own tenant" ON public.profiles
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() OR id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()));

-- 14. SMS logs
CREATE POLICY "Users can manage own tenant SMS logs" ON public.sms_logs
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 15. Tasks
CREATE POLICY "Users can manage own tenant tasks" ON public.tasks
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 16. Team members
CREATE POLICY "Users can view own tenant team members" ON public.team_members
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage team members" ON public.team_members
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'owner')
    ))
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 17. Templates
CREATE POLICY "Users can manage own tenant templates" ON public.templates
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 18. Tenant users (assuming this has tenant_id)
CREATE POLICY "Users can view tenant users" ON public.tenant_users
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

-- 19. User tenants
CREATE POLICY "Users can view own tenant associations" ON public.user_tenants
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR tenant_id = get_user_tenant_id());

-- ========================================
-- Tables WITHOUT tenant_id column
-- ========================================

-- 20. Campaign clicks (access through campaign)
CREATE POLICY "Users can view campaign clicks for own campaigns" ON public.campaign_clicks
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = campaign_clicks.campaign_id 
        AND c.tenant_id = get_user_tenant_id()
    ));

-- 21. Campaign links (access through campaign)
CREATE POLICY "Users can view campaign links for own campaigns" ON public.campaign_links
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = campaign_links.campaign_id 
        AND c.tenant_id = get_user_tenant_id()
    ));

-- 22. Campaign recipients (access through campaign)
CREATE POLICY "Users can manage campaign recipients for own campaigns" ON public.campaign_recipients
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = campaign_recipients.campaign_id 
        AND c.tenant_id = get_user_tenant_id()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.campaigns c 
        WHERE c.id = campaign_recipients.campaign_id 
        AND c.tenant_id = get_user_tenant_id()
    ));

-- 23. Platform settings (super admin only)
CREATE POLICY "Super admins can manage platform settings" ON public.platform_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = (SELECT auth.uid())));

-- 24. Super admins (view only for super admins)
CREATE POLICY "Super admins can view super admin list" ON public.super_admins
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = (SELECT auth.uid())));

-- 25. System audit log
CREATE POLICY "Users can view own actions in audit log" ON public.system_audit_log
    FOR SELECT TO authenticated
    USING (actor_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = (SELECT auth.uid())));

-- 26. Tenants
CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT TO authenticated
    USING (id = get_user_tenant_id() OR EXISTS (
        SELECT 1 FROM public.user_tenants 
        WHERE tenant_id = tenants.id 
        AND user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Tenant owners can update tenant" ON public.tenants
    FOR UPDATE TO authenticated
    USING (id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) 
        AND role = 'owner'
    ));

COMMIT;

-- Verify all policies were created
SELECT 
    'Tables with RLS but no policies - AFTER' as status,
    COUNT(*) as count
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = t.schemaname
        AND p.tablename = t.tablename
    );

-- Show summary of created policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'activities', 'analytics_events', 'automation_executions', 'automation_triggers',
        'automations', 'call_logs', 'campaign_clicks', 'campaign_links', 'campaign_recipients',
        'deals', 'expenses', 'integrations', 'invoice_sequences', 'message_outbox',
        'message_templates', 'platform_settings', 'profiles', 'sms_logs', 'super_admins',
        'system_audit_log', 'tasks', 'team_members', 'templates', 'tenant_users',
        'tenants', 'user_tenants'
    )
GROUP BY tablename
ORDER BY tablename;