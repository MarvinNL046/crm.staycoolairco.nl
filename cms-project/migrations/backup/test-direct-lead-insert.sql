-- Test direct lead insert with exact webhook data

INSERT INTO leads (
    tenant_id,
    name,
    email,
    phone,
    company,
    source,
    status,
    notes,
    tags
) VALUES (
    '80496bff-b559-4b80-9102-3a84afdaa616',
    'SQL Test Lead',
    'sql-test@example.com',
    '+31 6 1234 5678',
    'SQL Test Company BV',
    'WEBHOOK',
    'new'::lead_status,
    'Testing direct SQL insert',
    ARRAY['webhook', 'test']
) RETURNING *;