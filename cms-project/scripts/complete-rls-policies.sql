-- Complete RLS Policies voor alle tabellen
-- Gebaseerd op de werkelijke tabel structuur

-- Zorg eerst dat de helper functie bestaat
CREATE OR REPLACE FUNCTION public.get_user_tenant_id() 
RETURNS UUID AS $$
    SELECT tenant_id 
    FROM public.profiles 
    WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;

-- 1. ACTIVITIES - Activiteiten log voor leads
CREATE POLICY "Users can view their tenant's activities" ON activities
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create activities" ON activities
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());
CREATE POLICY "Users can update their own activities" ON activities
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());
CREATE POLICY "Users can delete their own activities" ON activities
    FOR DELETE USING (tenant_id = public.get_user_tenant_id() AND user_id = auth.uid());

-- 2. ANALYTICS_EVENTS - Analytics tracking
CREATE POLICY "Users can view their tenant's analytics" ON analytics_events
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create analytics events" ON analytics_events
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- 3. AUTOMATION_EXECUTIONS - Automation run history
CREATE POLICY "Users can view their automation executions" ON automation_executions
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "System can create automation executions" ON automation_executions
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- 4. AUTOMATION_TRIGGERS - Automation configuratie
CREATE POLICY "Users can manage their automation triggers" ON automation_triggers
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 5. AUTOMATIONS - Legacy automation table
CREATE POLICY "Users can manage their automations" ON automations
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 6. CALL_LOGS - Telefoon gesprekken log
CREATE POLICY "Users can manage their call logs" ON call_logs
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 7. CAMPAIGN_CLICKS - Email campaign click tracking (geen tenant_id)
CREATE POLICY "Users can view clicks for their campaigns" ON campaign_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN campaign_links cl ON cl.campaign_id = c.id
            WHERE cl.id = campaign_clicks.link_id
            AND c.tenant_id = public.get_user_tenant_id()
        )
    );

-- 8. CAMPAIGN_LINKS - Campaign link tracking (geen tenant_id)
CREATE POLICY "Users can manage links for their campaigns" ON campaign_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_links.campaign_id 
            AND campaigns.tenant_id = public.get_user_tenant_id()
        )
    );

-- 9. CAMPAIGN_RECIPIENTS - Campaign ontvangers (geen tenant_id)
CREATE POLICY "Users can manage recipients for their campaigns" ON campaign_recipients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = campaign_recipients.campaign_id 
            AND campaigns.tenant_id = public.get_user_tenant_id()
        )
    );

-- 10. DEALS - Deals/opportunities
CREATE POLICY "Users can manage their tenant's deals" ON deals
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 11. EXPENSES - Uitgaven
CREATE POLICY "Users can view their tenant's expenses" ON expenses
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create expenses" ON expenses
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update their created expenses" ON expenses
    FOR UPDATE USING (tenant_id = public.get_user_tenant_id() AND created_by = auth.uid());
CREATE POLICY "Admins can manage all expenses" ON expenses
    FOR ALL USING (
        tenant_id = public.get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'owner')
        )
    );

-- 12. INTEGRATIONS - Third-party integraties
CREATE POLICY "Users can manage their tenant's integrations" ON integrations
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 13. INVOICE_SEQUENCES - Factuurnummer sequenties
CREATE POLICY "Users can manage their invoice sequences" ON invoice_sequences
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 14. MESSAGE_OUTBOX - Uitgaande berichten queue
CREATE POLICY "Users can manage their message outbox" ON message_outbox
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 15. MESSAGE_TEMPLATES - Bericht templates
CREATE POLICY "Users can manage their message templates" ON message_templates
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 16. PLATFORM_SETTINGS - Platform-wide settings (GEEN tenant_id - super admin only!)
CREATE POLICY "Only super admins can view platform settings" ON platform_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins 
            WHERE super_admins.user_id = auth.uid()
        )
    );
CREATE POLICY "Only super admins can manage platform settings" ON platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_admins 
            WHERE super_admins.user_id = auth.uid()
        )
    );

-- 17. SMS_LOGS - SMS berichten log
CREATE POLICY "Users can manage their SMS logs" ON sms_logs
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 18. SUPER_ADMINS - Super admin users (GEEN tenant_id - zeer restrictief!)
CREATE POLICY "Only super admins can view super admin list" ON super_admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins sa 
            WHERE sa.user_id = auth.uid()
        )
    );

-- 19. SYSTEM_AUDIT_LOG - Audit logging (GEEN tenant_id - admin only)
CREATE POLICY "Super admins can view all audit logs" ON system_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM super_admins 
            WHERE super_admins.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can view their own audit logs" ON system_audit_log
    FOR SELECT USING (actor_id = auth.uid());

-- 20. TASKS - Taken
CREATE POLICY "Users can view their tenant's tasks" ON tasks
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (
        tenant_id = public.get_user_tenant_id() AND 
        (assigned_to = auth.uid() OR created_by = auth.uid())
    );
CREATE POLICY "Users can delete their created tasks" ON tasks
    FOR DELETE USING (tenant_id = public.get_user_tenant_id() AND created_by = auth.uid());

-- 21. TEAM_MEMBERS - Team leden
CREATE POLICY "Users can view their team members" ON team_members
    FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Admins can manage team members" ON team_members
    FOR ALL USING (
        tenant_id = public.get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'owner')
        )
    );

-- 22. TEMPLATES - Document/email templates
CREATE POLICY "Users can manage their templates" ON templates
    FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- 23. TENANT_USERS - Junction table voor tenant-user relaties
CREATE POLICY "Users can view their tenant associations" ON tenant_users
    FOR SELECT USING (
        tenant_id = public.get_user_tenant_id() OR 
        user_id = auth.uid()
    );
CREATE POLICY "Admins can manage tenant users" ON tenant_users
    FOR ALL USING (
        tenant_id = public.get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'owner')
        )
    );

-- 24. USER_TENANTS - Junction table voor user-tenant relaties  
CREATE POLICY "Users can view their own tenants" ON user_tenants
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can join invited tenants" ON user_tenants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 25. WORKFLOW_ACTIONS - Workflow action definitie (GEEN tenant_id - global)
CREATE POLICY "All users can view workflow actions" ON workflow_actions
    FOR SELECT USING (is_active = true);

-- 26. WORKFLOW_TRIGGERS - Workflow trigger definitie (GEEN tenant_id - global)
CREATE POLICY "All users can view workflow triggers" ON workflow_triggers
    FOR SELECT USING (is_active = true);

-- Verificatie: Check welke tabellen nu nog geen policies hebben
SELECT 
    tablename,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = t.tablename
    AND c.relrowsecurity = true
)
ORDER BY 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) = 0 
        THEN 0 
        ELSE 1 
    END,
    tablename;