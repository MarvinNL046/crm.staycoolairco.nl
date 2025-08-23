-- Fix the last_sign_in trigger that's causing login errors
BEGIN;

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS trigger_update_last_sign_in ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS update_last_sign_in();

-- Create a simpler function that doesn't rely on non-existent fields
CREATE OR REPLACE FUNCTION update_profile_on_auth_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Simply update the profile's last_sign_in_at and last_active_at to NOW()
    -- whenever the auth.users record is updated (which happens on login)
    UPDATE public.profiles 
    SET 
        last_sign_in_at = NOW(),
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
-- This will run after any update on auth.users (including login)
DO $$
BEGIN
    BEGIN
        CREATE TRIGGER trigger_update_profile_activity
            AFTER UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION update_profile_on_auth_change();
        RAISE NOTICE 'Created new trigger to update profile activity on login';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create trigger on auth.users: %', SQLERRM;
    END;
END $$;

COMMIT;

-- Verify the fix
SELECT 
    'TRIGGER STATUS' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
    AND tgname LIKE '%profile%';