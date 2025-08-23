-- Fix security warnings: Set search_path for functions
-- This prevents potential SQL injection via search_path manipulation

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix update_last_sign_in function (if it exists)
CREATE OR REPLACE FUNCTION update_last_sign_in()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.last_sign_in = NOW();
    RETURN NEW;
END;
$$;