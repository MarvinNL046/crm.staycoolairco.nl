-- Create webhooks management tables for production-ready webhook system

-- 1. Webhook configurations per tenant
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    webhook_secret VARCHAR(255) NOT NULL, -- Secret key for signature validation
    webhook_url VARCHAR(500) NOT NULL, -- Generated webhook URL
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Webhook logs for monitoring and security
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    webhook_type VARCHAR(50) NOT NULL, -- 'lead_capture', 'workflow_trigger', etc.
    request_method VARCHAR(10) NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    client_ip INET,
    user_agent TEXT,
    signature_valid BOOLEAN,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rate limiting tracking
CREATE TABLE IF NOT EXISTS webhook_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_ip INET NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Webhook security events
CREATE TABLE IF NOT EXISTS webhook_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'invalid_signature', 'rate_limit_exceeded', 'suspicious_ip'
    client_ip INET,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for tenant isolation
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_security_events ENABLE ROW LEVEL SECURITY;

-- Webhook configs policies
CREATE POLICY "Users can view webhook configs for their tenant" ON webhook_configs
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update webhook configs for their tenant" ON webhook_configs
    FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Webhook logs policies (read-only for users)
CREATE POLICY "Users can view webhook logs for their tenant" ON webhook_logs
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Security events policies (read-only for users)
CREATE POLICY "Users can view security events for their tenant" ON webhook_security_events
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Create indexes for performance
CREATE INDEX idx_webhook_configs_tenant_id ON webhook_configs(tenant_id);
CREATE INDEX idx_webhook_logs_tenant_id ON webhook_logs(tenant_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_webhook_logs_webhook_type ON webhook_logs(webhook_type);
CREATE INDEX idx_webhook_rate_limits_tenant_client ON webhook_rate_limits(tenant_id, client_ip);
CREATE INDEX idx_webhook_rate_limits_window ON webhook_rate_limits(window_start);
CREATE INDEX idx_webhook_security_events_tenant ON webhook_security_events(tenant_id);
CREATE INDEX idx_webhook_security_events_created_at ON webhook_security_events(created_at);

-- Create function to generate secure webhook secrets
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret TEXT;
BEGIN
    -- Generate a secure 64-character hex string
    SELECT encode(gen_random_bytes(32), 'hex') INTO secret;
    RETURN 'whsec_' || secret;
END;
$$;

-- Create function to clean up old webhook logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete logs older than 30 days
    DELETE FROM webhook_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete rate limit records older than 1 hour
    DELETE FROM webhook_rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Create updated_at trigger for webhook_configs
CREATE TRIGGER update_webhook_configs_updated_at 
    BEFORE UPDATE ON webhook_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for webhook_rate_limits
CREATE TRIGGER update_webhook_rate_limits_updated_at 
    BEFORE UPDATE ON webhook_rate_limits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize webhook configs for existing tenants
INSERT INTO webhook_configs (tenant_id, webhook_secret, webhook_url, is_active, rate_limit_per_minute)
SELECT 
    t.id as tenant_id,
    generate_webhook_secret() as webhook_secret,
    'https://crm.staycoolairco.nl/api/webhook/leads?tenant=' || t.id::text as webhook_url,
    true as is_active,
    60 as rate_limit_per_minute
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM webhook_configs wc 
    WHERE wc.tenant_id = t.id
);

-- Create scheduled job to cleanup old records (if pg_cron is available)
-- This would need to be run manually or via external cron if pg_cron extension is not available
-- SELECT cron.schedule('webhook-cleanup', '0 2 * * *', 'SELECT cleanup_old_webhook_logs(); SELECT cleanup_old_rate_limits();');

COMMENT ON TABLE webhook_configs IS 'Webhook configuration and secrets per tenant';
COMMENT ON TABLE webhook_logs IS 'Complete webhook request/response logging for monitoring and debugging';
COMMENT ON TABLE webhook_rate_limits IS 'Rate limiting tracking per IP per tenant';
COMMENT ON TABLE webhook_security_events IS 'Security events and suspicious activity logging';
COMMENT ON FUNCTION generate_webhook_secret() IS 'Generates cryptographically secure webhook secrets';
COMMENT ON FUNCTION cleanup_old_webhook_logs() IS 'Removes webhook logs older than 30 days';
COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Removes rate limit records older than 1 hour';