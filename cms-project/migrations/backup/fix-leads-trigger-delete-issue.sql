-- Fix the update_leads_search_fts trigger that causes errors on user deletion

BEGIN;

-- 1. First check current trigger setup
SELECT 
    'CURRENT LEADS TRIGGERS' as check,
    tgname as trigger_name,
    CASE 
        WHEN tgtype & 4 = 4 THEN 'INSERT'
        WHEN tgtype & 8 = 8 THEN 'DELETE'  
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        WHEN tgtype & 28 = 28 THEN 'INSERT OR UPDATE OR DELETE'
        WHEN tgtype & 20 = 20 THEN 'INSERT OR UPDATE'
        ELSE 'OTHER'
    END as events
FROM pg_trigger
WHERE tgrelid = 'public.leads'::regclass
    AND tgname LIKE '%search%';

-- 2. Drop the existing trigger
DROP TRIGGER IF EXISTS update_leads_search_fts_trigger ON public.leads;

-- 3. Create a fixed version that only runs on INSERT and UPDATE (not DELETE)
CREATE OR REPLACE FUNCTION public.update_leads_search_fts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Only update search_fts on INSERT or UPDATE, not DELETE
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    
    -- Update the search_fts column with a tsvector combining all searchable fields
    NEW.search_fts := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.company, '') || ' ' ||
        COALESCE(NEW.city, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.status, '') || ' ' ||
        COALESCE(NEW.source, '')
    );
    RETURN NEW;
END;
$$;

-- 4. Recreate trigger for INSERT and UPDATE only (not DELETE)
CREATE TRIGGER update_leads_search_fts_trigger
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_leads_search_fts();

-- 5. Verify the fix
SELECT 
    'FIXED LEADS TRIGGERS' as check,
    tgname as trigger_name,
    CASE 
        WHEN tgtype & 4 = 4 AND tgtype & 16 = 16 AND NOT (tgtype & 8 = 8) THEN '✅ INSERT/UPDATE only (correct)'
        WHEN tgtype & 8 = 8 THEN '❌ Still includes DELETE'
        ELSE 'Check manually'
    END as status
FROM pg_trigger
WHERE tgrelid = 'public.leads'::regclass
    AND tgname LIKE '%search%';

COMMIT;

-- Test that user deletion will now work
SELECT 'User deletion should now work without "description" errors!' as message;