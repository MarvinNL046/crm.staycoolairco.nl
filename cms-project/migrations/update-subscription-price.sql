-- Update subscription price for Staycool Airconditioning
UPDATE public.tenants 
SET monthly_price = 49.99
WHERE name = 'Staycool Airconditioning' 
    AND subscription_plan = 'professional'
    AND monthly_price = 0.00;

-- Verify the update
SELECT 
    'UPDATED SUBSCRIPTION' as section,
    name,
    subscription_plan,
    subscription_status,
    monthly_price,
    max_users,
    max_leads,
    subscription_ends_at
FROM public.tenants
WHERE name = 'Staycool Airconditioning';