-- Check if configuration data exists
SELECT 'BTW Percentages' as type, COUNT(*) as count 
FROM btw_percentages 
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'

UNION ALL

SELECT 'Tags', COUNT(*) 
FROM tags 
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'

UNION ALL

SELECT 'Email Templates', COUNT(*) 
FROM email_templates 
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';