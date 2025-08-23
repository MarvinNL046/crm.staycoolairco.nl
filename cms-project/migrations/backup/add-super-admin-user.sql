-- Add current user as super admin
-- Make sure to replace the email with your actual email address

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get user ID for the specified email
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = 'info@staycoolairco.nl';
    
    IF admin_user_id IS NOT NULL THEN
        -- Add to super_admins table if not already exists
        INSERT INTO public.super_admins (user_id, created_at)
        VALUES (admin_user_id, NOW())
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Super admin added successfully for user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'User with email info@staycoolairco.nl not found in auth.users';
    END IF;
END $$;

-- Verify the super admin was added
SELECT 
    'Super admin verification' as check_type,
    sa.user_id,
    u.email,
    sa.created_at
FROM public.super_admins sa
JOIN auth.users u ON sa.user_id = u.id
WHERE u.email = 'info@staycoolairco.nl';