-- Fix dangerous policies that allow cross-tenant access
-- CRITICAL: These policies currently allow any authenticated user to access ANY tenant's data!

BEGIN;

-- 1. Fix campaign_metrics - currently allows EVERYONE to do EVERYTHING
DROP POLICY IF EXISTS "Authenticated users can manage campaign_metrics" ON public.campaign_metrics;

-- Create proper tenant-isolated policies
CREATE POLICY "Users can view own tenant campaign metrics" ON public.campaign_metrics
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage own tenant campaign metrics" ON public.campaign_metrics
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 2. Fix pipeline_stages - currently allows EVERYONE to do EVERYTHING
DROP POLICY IF EXISTS "Authenticated users can manage pipeline_stages" ON public.pipeline_stages;

-- Create proper tenant-isolated policies
CREATE POLICY "Users can view own tenant pipeline stages" ON public.pipeline_stages
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage own tenant pipeline stages" ON public.pipeline_stages
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id())
    WITH CHECK (tenant_id = get_user_tenant_id());

-- 3. Fix profiles UPDATE policy - currently missing tenant check
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with proper tenant isolation
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        id = (SELECT auth.uid()) 
        AND tenant_id = get_user_tenant_id()
    )
    WITH CHECK (
        id = (SELECT auth.uid()) 
        AND tenant_id = get_user_tenant_id()
    );

-- 4. Fix workflow_templates - check if this should be tenant-specific or truly global
-- First, check if workflow_templates has tenant_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'workflow_templates' 
        AND column_name = 'tenant_id'
    ) THEN
        -- If it has tenant_id, apply tenant isolation
        DROP POLICY IF EXISTS "Authenticated users can view workflow templates" ON public.workflow_templates;
        
        CREATE POLICY "Users can view own tenant workflow templates" ON public.workflow_templates
            FOR SELECT TO authenticated
            USING (tenant_id = get_user_tenant_id());
            
        CREATE POLICY "Admins can manage workflow templates" ON public.workflow_templates
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
    ELSE
        -- If no tenant_id, it might be a global template library
        -- In that case, we should still restrict who can modify them
        DROP POLICY IF EXISTS "Authenticated users can view workflow templates" ON public.workflow_templates;
        
        -- Everyone can view templates (they're like a template library)
        CREATE POLICY "Users can view workflow templates" ON public.workflow_templates
            FOR SELECT TO authenticated
            USING (true);
            
        -- Only super admins can modify global templates
        CREATE POLICY "Super admins can manage workflow templates" ON public.workflow_templates
            FOR INSERT TO authenticated
            WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = (SELECT auth.uid())));
            
        CREATE POLICY "Super admins can update workflow templates" ON public.workflow_templates
            FOR UPDATE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = (SELECT auth.uid())));
            
        CREATE POLICY "Super admins can delete workflow templates" ON public.workflow_templates
            FOR DELETE TO authenticated
            USING (EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = (SELECT auth.uid())));
    END IF;
END $$;

COMMIT;

-- Verify the fixes
SELECT 
    'VERIFICATION: Dangerous policies after fix' as check_type,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual = 'true' THEN '🚨 STILL ALLOWS EVERYONE!'
        WHEN qual LIKE '%tenant_id = get_user_tenant_id()%' THEN '✅ Proper tenant isolation'
        WHEN qual LIKE '%auth.uid()%' AND qual LIKE '%tenant_id%' THEN '✅ User + tenant isolation'
        WHEN qual LIKE '%super_admin%' THEN '✅ Super admin only'
        ELSE '⚠️  Check this policy'
    END as status,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('campaign_metrics', 'pipeline_stages', 'profiles', 'workflow_templates')
ORDER BY tablename, policyname;

-- Double-check: Are there any other policies with qual = 'true'?
SELECT 
    'OTHER POLICIES ALLOWING EVERYONE' as warning,
    tablename,
    policyname,
    cmd,
    'Allows access to ALL authenticated users regardless of tenant!' as risk
FROM pg_policies
WHERE schemaname = 'public'
    AND qual = 'true'
    AND tablename NOT IN (
        -- Exclude tables we just fixed and tables that might legitimately be global
        'workflow_templates'  -- We'll have checked this above
    )
ORDER BY tablename;