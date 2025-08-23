-- Check if tenants table has subscription columns
SELECT 
    'tenants table columns' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tenants'
ORDER BY ordinal_position;

-- Check if there's a separate subscriptions table
SELECT 
    'checking for subscriptions table' as info,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%subscription%'
    OR table_name LIKE '%plan%'
    OR table_name LIKE '%billing%';

-- Sample current tenant data to see what we have
SELECT 
    'current tenant data' as info,
    *
FROM public.tenants
LIMIT 3;