-- Check leads table structure and constraints

-- 1. Show leads table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 2. Check if sequences are accessible
SELECT 
    sequence_name,
    sequence_schema
FROM information_schema.sequences
WHERE sequence_schema = 'public';

-- 3. Check constraints on leads table
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'leads';

-- 4. Test if we can use gen_random_uuid()
SELECT gen_random_uuid() as test_uuid;

-- 5. Check RLS policies again with more detail
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY cmd, policyname;