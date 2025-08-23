-- Check all tables in the database
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get table sizes
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    typname as column_type,
    attnum as column_position
FROM pg_attribute
JOIN pg_class ON pg_class.oid = pg_attribute.attrelid
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
JOIN pg_type ON pg_type.oid = pg_attribute.atttypid
WHERE 
    pg_namespace.nspname = 'public' 
    AND pg_attribute.attnum > 0
    AND NOT pg_attribute.attisdropped
ORDER BY tablename, column_position;