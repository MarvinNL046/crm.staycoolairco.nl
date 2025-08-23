-- Debug leads table insert issue

-- 1. Show ALL columns in leads table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 2. Test if we can insert a lead directly
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Try to insert a test lead
    INSERT INTO leads (
        tenant_id,
        company_name,
        contact_name,
        email,
        phone,
        website,
        source,
        status,
        priority,
        description,
        notes,
        metadata
    ) VALUES (
        '80496bff-b559-4b80-9102-3a84afdaa616',
        'Direct Test Company',
        'Direct Test Contact',
        'direct-test@example.com',
        '+31612345678',
        'https://example.com',
        'WEBHOOK',
        'NEW',
        'MEDIUM',
        'Direct SQL test',
        'Testing direct insert',
        '{}'::jsonb
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE 'Successfully inserted lead with ID: %', test_id;
    
    -- Clean up test
    DELETE FROM leads WHERE id = test_id;
    RAISE NOTICE 'Test lead cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Insert failed with error: % - %', SQLSTATE, SQLERRM;
END $$;

-- 3. Check if there are any unique constraints that might be violated
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'leads'
ORDER BY tc.constraint_type, tc.constraint_name;