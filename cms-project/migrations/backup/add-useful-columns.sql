-- Add useful columns for better user and subscription tracking
BEGIN;

-- ========================================
-- 1. Add last_sign_in_at to profiles table
-- ========================================
DO $$ 
BEGIN 
    -- Add last_sign_in_at column to track user activity
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_sign_in_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN last_sign_in_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added last_sign_in_at column to profiles table';
    ELSE
        RAISE NOTICE 'last_sign_in_at column already exists in profiles table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to profiles table';
    END IF;

    -- Add last_active_at for more granular activity tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_active_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added last_active_at column to profiles table';
    END IF;
END $$;

-- ========================================
-- 2. Add subscription tracking columns to tenants
-- ========================================
DO $$ 
BEGIN 
    -- Add subscription_plan column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free';
        
        RAISE NOTICE 'Added subscription_plan column to tenants table';
    END IF;

    -- Add subscription_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active';
        
        RAISE NOTICE 'Added subscription_status column to tenants table';
    END IF;

    -- Add subscription_started_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_started_at'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added subscription_started_at column to tenants table';
    END IF;

    -- Add subscription_ends_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_ends_at'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added subscription_ends_at column to tenants table';
    END IF;

    -- Add monthly_price
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'monthly_price'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN monthly_price DECIMAL(10,2) DEFAULT 0.00;
        
        RAISE NOTICE 'Added monthly_price column to tenants table';
    END IF;

    -- Add max_users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'max_users'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN max_users INTEGER DEFAULT 1;
        
        RAISE NOTICE 'Added max_users column to tenants table';
    END IF;

    -- Add max_leads
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'max_leads'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN max_leads INTEGER DEFAULT 100;
        
        RAISE NOTICE 'Added max_leads column to tenants table';
    END IF;

    -- Add updated_at to tenants if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to tenants table';
    END IF;
END $$;

-- ========================================
-- 3. Create enum types for better data integrity
-- ========================================
DO $$
BEGIN
    -- Create subscription plan enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
        CREATE TYPE subscription_plan_type AS ENUM ('free', 'starter', 'professional', 'enterprise');
        RAISE NOTICE 'Created subscription_plan_type enum';
    END IF;

    -- Create subscription status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
        CREATE TYPE subscription_status_type AS ENUM ('active', 'cancelled', 'expired', 'suspended', 'trial');
        RAISE NOTICE 'Created subscription_status_type enum';
    END IF;
END $$;

-- ========================================
-- 4. Add some sample data to existing tenant
-- ========================================
UPDATE public.tenants 
SET 
    subscription_plan = 'professional',
    subscription_status = 'active',
    subscription_started_at = COALESCE(subscription_started_at, created_at),
    subscription_ends_at = COALESCE(subscription_ends_at, created_at + INTERVAL '1 year'),
    monthly_price = COALESCE(monthly_price, 49.99),
    max_users = COALESCE(max_users, 10),
    max_leads = COALESCE(max_leads, 1000),
    updated_at = NOW()
WHERE name = 'Staycool Airconditioning'
    AND (subscription_plan IS NULL OR subscription_plan = 'free');

-- ========================================
-- 5. Create function to update last_sign_in_at
-- ========================================
CREATE OR REPLACE FUNCTION update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_sign_in_at when auth.users last_sign_in_at changes
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET 
            last_sign_in_at = NEW.last_sign_in_at,
            last_active_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if we have access)
-- Note: This might not work if we don't have access to auth schema
DO $$
BEGIN
    -- Try to create trigger, but don't fail if we can't
    BEGIN
        DROP TRIGGER IF EXISTS trigger_update_last_sign_in ON auth.users;
        CREATE TRIGGER trigger_update_last_sign_in
            AFTER UPDATE ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION update_last_sign_in();
        RAISE NOTICE 'Created trigger to sync last_sign_in_at';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not create trigger on auth.users (permission denied): %', SQLERRM;
    END;
END $$;

-- ========================================
-- 6. Create indexes for new columns
-- ========================================
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in_at 
    ON public.profiles(last_sign_in_at);

CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at 
    ON public.profiles(last_active_at);

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan 
    ON public.tenants(subscription_plan);

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status 
    ON public.tenants(subscription_status);

CREATE INDEX IF NOT EXISTS idx_tenants_subscription_ends_at 
    ON public.tenants(subscription_ends_at);

COMMIT;

-- ========================================
-- 7. Verify the additions
-- ========================================
SELECT 
    'NEW COLUMNS VERIFICATION' as section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND (
        (table_name = 'profiles' AND column_name IN ('last_sign_in_at', 'last_active_at', 'updated_at'))
        OR 
        (table_name = 'tenants' AND column_name IN ('subscription_plan', 'subscription_status', 'monthly_price', 'max_users', 'max_leads', 'subscription_started_at', 'subscription_ends_at'))
    )
ORDER BY table_name, column_name;

-- Show updated tenant data
SELECT 
    'UPDATED TENANT DATA' as section,
    name,
    subscription_plan,
    subscription_status,
    monthly_price,
    max_users,
    max_leads,
    subscription_ends_at
FROM public.tenants;