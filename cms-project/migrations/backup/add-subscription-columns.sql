-- Add subscription management columns to tenants table
BEGIN;

-- Add subscription columns if they don't exist
DO $$ 
BEGIN 
    -- Add subscription_plan column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free';
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
    END IF;

    -- Add subscription_started_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_started_at'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add subscription_ends_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'subscription_ends_at'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add monthly_price column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'monthly_price'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN monthly_price DECIMAL(10,2) DEFAULT 0.00;
    END IF;

    -- Add max_users column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'max_users'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN max_users INTEGER DEFAULT 1;
    END IF;

    -- Add max_leads column  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants' 
        AND column_name = 'max_leads'
    ) THEN
        ALTER TABLE public.tenants 
        ADD COLUMN max_leads INTEGER DEFAULT 100;
    END IF;

END $$;

-- Create subscription plans enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
        CREATE TYPE subscription_plan_type AS ENUM ('free', 'starter', 'professional', 'enterprise');
    END IF;
END $$;

-- Create subscription status enum type if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
        CREATE TYPE subscription_status_type AS ENUM ('active', 'cancelled', 'expired', 'suspended', 'trial');
    END IF;
END $$;

-- Update existing tenant with sample subscription data
UPDATE public.tenants 
SET 
    subscription_plan = 'professional',
    subscription_status = 'active',
    subscription_started_at = created_at,
    subscription_ends_at = created_at + INTERVAL '1 year',
    monthly_price = 49.99,
    max_users = 10,
    max_leads = 1000
WHERE name = 'Staycool Airconditioning';

COMMIT;

-- Verify the changes
SELECT 
    'Updated tenant subscription info' as info,
    name,
    subscription_plan,
    subscription_status,
    subscription_started_at,
    subscription_ends_at,
    monthly_price,
    max_users,
    max_leads
FROM public.tenants;