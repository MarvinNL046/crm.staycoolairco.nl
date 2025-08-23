-- Fix the update_leads_search_fts trigger function

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS update_leads_search_fts_trigger ON leads;

-- Drop the old function
DROP FUNCTION IF EXISTS update_leads_search_fts();

-- Create a fixed version of the function
CREATE OR REPLACE FUNCTION update_leads_search_fts() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_fts := to_tsvector('simple',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.company, '') || ' ' ||
        COALESCE(NEW.notes, '') || ' ' ||
        COALESCE(NEW.source, '') || ' ' ||
        COALESCE(NEW.status::text, 'new')  -- Cast enum to text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_leads_search_fts_trigger 
BEFORE INSERT OR UPDATE ON leads 
FOR EACH ROW 
EXECUTE FUNCTION update_leads_search_fts();

-- Test if it works now
INSERT INTO leads (
    tenant_id,
    name
) VALUES (
    '80496bff-b559-4b80-9102-3a84afdaa616'::uuid,
    'Test After Fix'
) RETURNING id, name, status;

-- Clean up test
DELETE FROM leads WHERE name = 'Test After Fix';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== LEADS SEARCH TRIGGER FIXED ===';
    RAISE NOTICE 'The trigger now properly handles the status enum';
    RAISE NOTICE 'Webhook should be able to insert leads now!';
END $$;