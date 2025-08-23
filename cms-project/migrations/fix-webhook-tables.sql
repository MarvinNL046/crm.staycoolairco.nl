-- Fix webhook tables - handle existing partial installations
-- This script safely updates existing webhook tables or creates them fresh

-- First, let's handle the webhook_logs table issue
DO $$
BEGIN
    -- Check if webhook_logs table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webhook_logs') THEN
        -- Table exists, check if webhook_type column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'webhook_logs' AND column_name = 'webhook_type'
        ) THEN
            -- Add missing columns to existing table
            ALTER TABLE webhook_logs ADD COLUMN webhook_type VARCHAR(50);
            ALTER TABLE webhook_logs ADD COLUMN request_method VARCHAR(10);
            ALTER TABLE webhook_logs ADD COLUMN request_headers JSONB;
            ALTER TABLE webhook_logs ADD COLUMN request_body JSONB;
            ALTER TABLE webhook_logs ADD COLUMN response_status INTEGER;
            ALTER TABLE webhook_logs ADD COLUMN response_body JSONB;
            ALTER TABLE webhook_logs ADD COLUMN client_ip INET;
            ALTER TABLE webhook_logs ADD COLUMN user_agent TEXT;
            ALTER TABLE webhook_logs ADD COLUMN signature_valid BOOLEAN;
            ALTER TABLE webhook_logs ADD COLUMN processing_time_ms INTEGER;
            ALTER TABLE webhook_logs ADD COLUMN error_message TEXT;
            
            -- Update existing records with default values
            UPDATE webhook_logs SET 
                webhook_type = 'legacy',
                request_method = 'POST',
                signature_valid = false
            WHERE webhook_type IS NULL;
            
            -- Make webhook_type NOT NULL after setting defaults
            ALTER TABLE webhook_logs ALTER COLUMN webhook_type SET NOT NULL;
            ALTER TABLE webhook_logs ALTER COLUMN request_method SET NOT NULL;
        END IF;
    ELSE
        -- Table doesn't exist, create it
        CREATE TABLE webhook_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            webhook_type VARCHAR(50) NOT NULL,
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
    END IF;
END $$;

-- Now create other tables safely
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

-- Enable RLS (safe)
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_security_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely
DO $$
BEGIN
    -- webhook_configs policies
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

    -- webhook_logs policies
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

    -- webhook_security_events policies
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

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant_id ON webhook_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tenant_id ON webhook_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_tenant_client ON webhook_rate_limits(tenant_id, client_ip);
CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window ON webhook_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_tenant ON webhook_security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_created_at ON webhook_security_events(created_at);

-- Create functions
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    secret TEXT;
BEGIN
    SELECT encode(gen_random_bytes(32), 'hex') INTO secret;
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

-- Create triggers safely
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

-- Add comments
COMMENT ON TABLE webhook_configs IS 'Webhook configuration and secrets per tenant';
COMMENT ON TABLE webhook_logs IS 'Complete webhook request/response logging for monitoring and debugging';
COMMENT ON TABLE webhook_rate_limits IS 'Rate limiting tracking per IP per tenant';
COMMENT ON TABLE webhook_security_events IS 'Security events and suspicious activity logging';