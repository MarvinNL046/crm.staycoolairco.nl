-- First check the super_admins table structure
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

-- Add current user as super admin with proper email
DO $$
DECLARE
    admin_user_id UUID;
    admin_email TEXT;
BEGIN
    -- Get user ID and email for the specified email
    SELECT id, email INTO admin_user_id, admin_email
    FROM auth.users
    WHERE email = 'info@staycoolairco.nl';
    
    IF admin_user_id IS NOT NULL THEN
        -- Add to super_admins table with email field
        INSERT INTO public.super_admins (user_id, email, created_at)
        VALUES (admin_user_id, admin_email, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
            email = EXCLUDED.email,
            updated_at = NOW();
        
        RAISE NOTICE 'Super admin added successfully for user: % with email: %', admin_user_id, admin_email;
    ELSE
        RAISE NOTICE 'User with email info@staycoolairco.nl not found in auth.users';
        
        -- Let's check what users exist
        RAISE NOTICE 'Available users in auth.users:';
        FOR admin_email IN 
            SELECT email FROM auth.users LIMIT 5
        LOOP
            RAISE NOTICE 'Found user: %', admin_email;
        END LOOP;
    END IF;
END $$;

-- Verify the super admin was added
SELECT 
    'Super admin verification' as check_type,
    sa.user_id,
    sa.email,
    sa.created_at
FROM public.super_admins sa
WHERE sa.email = 'info@staycoolairco.nl';