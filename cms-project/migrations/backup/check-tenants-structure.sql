-- Check current tenants table structure
SELECT 
    'tenants table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tenants'
ORDER BY ordinal_position;

-- Sample tenant data without subscription_plan
SELECT 
    'current tenant data' as check_type,
    t.id,
    t.name,
    t.domain,
    t.created_at,
    -- Count users per tenant
    (SELECT COUNT(*) FROM public.profiles WHERE tenant_id = t.id) as user_count,
    -- Count leads per tenant  
    (SELECT COUNT(*) FROM public.leads WHERE tenant_id = t.id) as leads_count
FROM public.tenants t
ORDER BY t.created_at DESC
LIMIT 10;