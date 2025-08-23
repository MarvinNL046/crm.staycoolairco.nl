-- Get webhook configuration for tenant
SELECT 
    tenant_id,
    LEFT(webhook_secret, 15) || '...' as secret_preview,
    webhook_url,
    is_active,
    rate_limit_per_minute,
    created_at
FROM webhook_configs 
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';