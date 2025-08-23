-- Update webhook secret to match what's shown in the UI

-- First, let's see the current webhook config
SELECT 
    id,
    tenant_id,
    webhook_url,
    webhook_secret,
    is_active
FROM webhook_configs
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';

-- Update the webhook secret to match the UI
UPDATE webhook_configs
SET 
    webhook_secret = 'wh_secret_abc123xyz789',
    updated_at = NOW()
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';

-- Verify the update
SELECT 
    id,
    tenant_id,
    webhook_url,
    webhook_secret,
    is_active,
    updated_at
FROM webhook_configs
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';