-- Check the structure of pipeline_stages table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pipeline_stages'
ORDER BY ordinal_position;

-- Also check if there's any data in it
SELECT * FROM pipeline_stages LIMIT 5;