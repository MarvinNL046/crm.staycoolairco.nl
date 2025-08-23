-- First, show all existing users so you can see which email to use
SELECT 
    'Available users in system' as info,
    u.id,
    u.email,
    u.created_at,
    CASE WHEN sa.user_id IS NOT NULL THEN 'Already Super Admin' ELSE 'Regular User' END as status
FROM auth.users u
LEFT JOIN public.super_admins sa ON u.id = sa.user_id
ORDER BY u.created_at DESC;

-- Also show profiles table
SELECT 
    'Users in profiles table' as info,
    p.id,
    p.email,
    p.full_name,
    p.role,
    t.name as tenant_name
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
ORDER BY p.created_at DESC;

-- Function to add any user as super admin (replace email as needed)
-- UNCOMMENT AND MODIFY THE EMAIL BELOW:

/*
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT := 'YOUR_EMAIL_HERE@domain.com'; -- CHANGE THIS!
BEGIN
    -- Get user ID for the specified email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF admin_user_id IS NOT NULL THEN
        -- Add to super_admins table with all required fields
        INSERT INTO public.super_admins (user_id, email, created_at)
        VALUES (admin_user_id, admin_email, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            email = EXCLUDED.email;
        
        RAISE NOTICE 'Super admin added successfully for: %', admin_email;
    ELSE
        RAISE NOTICE 'User with email % not found in auth.users', admin_email;
    END IF;
END $$;
*/

-- After adding super admin, verify it worked
SELECT 
    'Super admin verification' as info,
    sa.id,
    sa.user_id,
    sa.email,
    sa.created_at,
    u.email as auth_email
FROM public.super_admins sa
LEFT JOIN auth.users u ON sa.user_id = u.id
ORDER BY sa.created_at DESC;