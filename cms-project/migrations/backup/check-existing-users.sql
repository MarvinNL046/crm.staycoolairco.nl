-- Check what users exist in the system
SELECT 
    'Users in auth.users' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Check users in profiles table
SELECT 
    'Users in profiles table' as check_type,
    p.id,
    p.email,
    p.full_name,
    p.role,
    t.name as tenant_name
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
ORDER BY p.created_at DESC;