-- Check the update_leads_search_fts trigger function
\df+ update_leads_search_fts

-- Show the function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_leads_search_fts';

-- Let's also check if we can insert without triggering the search update
-- by checking what columns the webhook is actually setting
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'search_fts';