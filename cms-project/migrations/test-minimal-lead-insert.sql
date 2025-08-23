-- Test minimal lead insert to debug the issue

-- First, let's see if the search_fts column allows NULL
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'leads' 
AND column_name = 'search_fts';

-- Try inserting with minimal required fields
INSERT INTO leads (
    tenant_id,
    name
) VALUES (
    '80496bff-b559-4b80-9102-3a84afdaa616'::uuid,
    'Minimal Test Lead'
) RETURNING id, name, status, search_fts IS NULL as search_is_null;

-- If that works, delete the test lead
-- DELETE FROM leads WHERE name = 'Minimal Test Lead';