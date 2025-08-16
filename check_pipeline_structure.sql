-- Check if pipeline_stages table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pipeline_stages'
ORDER BY ordinal_position;

-- If it doesn't exist, let's check what tables we do have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;