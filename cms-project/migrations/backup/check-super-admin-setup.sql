-- Check current super admin setup and data
-- This will help us understand what we have to work with

-- 1. Check super_admins table structure
SELECT 
    'super_admins table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'super_admins'
ORDER BY ordinal_position;

-- 2. Check current super admin data
SELECT 
    'current super admins' as check_type,
    COUNT(*) as total_super_admins,
    STRING_AGG(user_id::text, ', ') as super_admin_user_ids
FROM public.super_admins;

-- 3. Check if super admins exist in profiles table
SELECT 
    'super admin profiles' as check_type,
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.tenant_id,
    CASE WHEN sa.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as is_super_admin
FROM public.profiles p
LEFT JOIN public.super_admins sa ON p.id = sa.user_id
WHERE sa.user_id IS NOT NULL OR p.email LIKE '%staycoolairco%'
ORDER BY is_super_admin DESC, p.email;

-- 4. Check tenants overview for management dashboard
SELECT 
    'tenants overview' as check_type,
    COUNT(*) as total_tenants,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_tenants_last_30_days,
    MIN(created_at) as oldest_tenant,
    MAX(created_at) as newest_tenant
FROM public.tenants;

-- 5. Sample tenant data for dashboard
SELECT 
    'sample tenant data' as check_type,
    t.id,
    t.name,
    t.domain,
    t.subscription_plan,
    t.created_at,
    -- Count users per tenant
    (SELECT COUNT(*) FROM public.profiles WHERE tenant_id = t.id) as user_count,
    -- Count leads per tenant  
    (SELECT COUNT(*) FROM public.leads WHERE tenant_id = t.id) as leads_count
FROM public.tenants t
ORDER BY t.created_at DESC
LIMIT 5;