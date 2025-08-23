-- Fix webhook tables - work with existing webhook_logs structure
-- This script adapts to your existing webhook_logs table and adds what's missing

DO $$
BEGIN
    -- Your existing webhook_logs table has these columns:
    -- id, tenant_id, url, method, headers, payload, response_status, response_body, created_at
    -- We need to add missing columns for our new webhook system
    
    RAISE NOTICE 'Updating existing webhook_logs table structure...';
    
    -- Add missing columns to existing webhook_logs table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'webhook_type') THEN
        ALTER TABLE webhook_logs ADD COLUMN webhook_type VARCHAR(50);
        RAISE NOTICE 'Added webhook_type column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'client_ip') THEN
        ALTER TABLE webhook_logs ADD COLUMN client_ip INET;
        RAISE NOTICE 'Added client_ip column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE webhook_logs ADD COLUMN user_agent TEXT;
        RAISE NOTICE 'Added user_agent column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'signature_valid') THEN
        ALTER TABLE webhook_logs ADD COLUMN signature_valid BOOLEAN;
        RAISE NOTICE 'Added signature_valid column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'processing_time_ms') THEN
        ALTER TABLE webhook_logs ADD COLUMN processing_time_ms INTEGER;
        RAISE NOTICE 'Added processing_time_ms column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'webhook_logs' AND column_name = 'error_message') THEN
        ALTER TABLE webhook_logs ADD COLUMN error_message TEXT;
        RAISE NOTICE 'Added error_message column';
    END IF;
    
    -- Update existing records with default values
    UPDATE webhook_logs SET 
        webhook_type = 'legacy',
        signature_valid = false
    WHERE webhook_type IS NULL;
    
    RAISE NOTICE 'Updated existing webhook_logs records with default values';
    
END $$;

-- Create other missing tables
CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    webhook_secret VARCHAR(255) NOT NULL, 
    webhook_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_ip INET NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    client_ip INET,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all webhook tables
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_configs' 
        AND policyname = 'Users can view webhook configs for their tenant'
    ) THEN
        CREATE POLICY "Users can view webhook configs for their tenant" ON webhook_configs
            FOR SELECT USING (tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_configs' 
        AND policyname = 'Users can update webhook configs for their tenant'
    ) THEN
        CREATE POLICY "Users can update webhook configs for their tenant" ON webhook_configs
            FOR UPDATE USING (tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_logs' 
        AND policyname = 'Users can view webhook logs for their tenant'
    ) THEN
        CREATE POLICY "Users can view webhook logs for their tenant" ON webhook_logs
            FOR SELECT USING (tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_security_events' 
        AND policyname = 'Users can view security events for their tenant'
    ) THEN
        CREATE POLICY "Users can view security events for their tenant" ON webhook_security_events
            FOR SELECT USING (tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            ));
    END IF;
END $$;

-- Create additional indexes needed
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant_id ON webhook_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_tenant_client ON webhook_rate_limits(tenant_id, client_ip);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON webhook_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_tenant ON webhook_security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_created_at ON webhook_security_events(created_at);

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create utility functions
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret TEXT;
BEGIN
    -- Use gen_random_bytes with pgcrypto extension
    SELECT encode(gen_random_bytes(32), 'hex') INTO secret;
    RETURN 'whsec_' || secret;
EXCEPTION 
    WHEN OTHERS THEN
        -- Fallback method if gen_random_bytes is not available
        SELECT md5(random()::text || clock_timestamp()::text || random()::text) INTO secret;
        RETURN 'whsec_' || secret;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Create triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_webhook_configs_updated_at'
    ) THEN
        CREATE TRIGGER update_webhook_configs_updated_at 
            BEFORE UPDATE ON webhook_configs 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_webhook_rate_limits_updated_at'
    ) THEN
        CREATE TRIGGER update_webhook_rate_limits_updated_at 
            BEFORE UPDATE ON webhook_rate_limits 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== WEBHOOK SETUP COMPLETED ===';
    RAISE NOTICE 'Your existing webhook_logs table has been enhanced with new columns';
    RAISE NOTICE 'New tables created: webhook_configs, webhook_rate_limits, webhook_security_events';
    RAISE NOTICE 'RLS policies and indexes have been added';
    RAISE NOTICE 'Webhook configurations initialized for all tenants';
    RAISE NOTICE 'Your webhooks are now production-ready!';
END $$;