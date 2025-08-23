-- Step 1: Find your user ID and email
SELECT 
    'Your user info' as info,
    id as user_id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Add yourself as super admin
-- Replace 'your-email@domain.com' with your actual email from step 1
INSERT INTO public.super_admins (user_id, email, created_at)
SELECT 
    u.id,
    u.email,
    NOW()
FROM auth.users u
WHERE u.email = 'info@staycoolairco.nl'  -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Verify you're now a super admin
SELECT 
    'Super admin verification' as status,
    sa.id,
    sa.user_id,
    sa.email,
    sa.created_at
FROM public.super_admins sa
ORDER BY sa.created_at DESC;