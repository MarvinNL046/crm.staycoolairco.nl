-- ================================================================
-- SUPABASE DASHBOARD SQL - COMMUNICATION TABLES
-- Copy-paste deze queries een voor een in: Dashboard > SQL Editor
-- ================================================================

-- 1. EMAIL_LOGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Email Content
    subject TEXT NOT NULL,
    body TEXT,
    html_body TEXT,
    
    -- Recipients & Sender
    to_email TEXT NOT NULL,
    to_name TEXT,
    from_email TEXT NOT NULL,
    from_name TEXT,
    cc_emails TEXT[], -- Array of CC emails
    bcc_emails TEXT[], -- Array of BCC emails
    
    -- References to other entities
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    
    -- Status & Provider Info
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    provider TEXT, -- 'resend', 'sendgrid', 'gmail', etc.
    provider_message_id TEXT,
    error_message TEXT,
    
    -- Tracking Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    
    -- Standard fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for email_logs performance
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON email_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id) WHERE contact_id IS NOT NULL;

-- Enable RLS for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY "Users can only access their tenant's email logs" ON email_logs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ================================================================

-- 2. SMS_LOGS TABLE  
-- ================================================================
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- SMS Content
    message TEXT NOT NULL,
    
    -- Recipients & Sender
    to_phone TEXT NOT NULL,
    to_name TEXT,
    from_phone TEXT NOT NULL,
    
    -- References to other entities
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    
    -- Status & Provider Info
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    provider TEXT, -- 'messagebird', 'twilio', etc.
    provider_message_id TEXT,
    error_message TEXT,
    
    -- Tracking Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Cost tracking
    cost_cents INTEGER, -- Cost in cents
    currency TEXT DEFAULT 'EUR',
    
    -- Standard fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for sms_logs performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_id ON sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_phone ON sms_logs(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_lead_id ON sms_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_logs_contact_id ON sms_logs(contact_id) WHERE contact_id IS NOT NULL;

-- Enable RLS for sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY "Users can only access their tenant's sms logs" ON sms_logs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ================================================================

-- 3. CREATE TRIGGERS FOR updated_at FIELDS
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Add triggers
CREATE TRIGGER update_email_logs_updated_at 
    BEFORE UPDATE ON email_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_logs_updated_at 
    BEFORE UPDATE ON sms_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================

-- 4. INSERT SAMPLE DATA (optional)
-- ================================================================
-- Sample email log
INSERT INTO email_logs (
    tenant_id, 
    subject, 
    body, 
    to_email, 
    to_name, 
    from_email, 
    from_name, 
    status,
    template_id,
    sent_at
) VALUES (
    '80496bff-b559-4b80-9102-3a84afdaa616',
    'Welkom bij Staycool Airconditioning!',
    'Beste Marvin, bedankt voor uw interesse in onze airconditioning services!',
    'Marvinsmit1988@gmail.com',
    'Marvin Smit',
    'info@staycoolairco.nl',
    'Staycool Airconditioning',
    'sent',
    (SELECT id FROM message_templates WHERE name = 'Welkom Nieuwe Lead' LIMIT 1),
    NOW()
);

-- Sample SMS log
INSERT INTO sms_logs (
    tenant_id,
    message,
    to_phone,
    to_name,
    from_phone,
    status,
    template_id,
    sent_at,
    cost_cents
) VALUES (
    '80496bff-b559-4b80-9102-3a84afdaa616',
    'Hallo Marvin, uw afspraak voor airco installatie is bevestigd op 25-08-2025 om 14:00. Tot dan! - Staycool',
    '+31636481054',
    'Marvin Smit',
    '+31636481054',
    'delivered',
    (SELECT id FROM message_templates WHERE name = 'Afspraak Bevestiging' LIMIT 1),
    NOW(),
    8
);

-- ================================================================
-- VERIFICATION QUERIES (run these to test)
-- ================================================================

-- Check if tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_logs', 'sms_logs')
ORDER BY table_name;

-- Check sample data
SELECT COUNT(*) as email_count FROM email_logs WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';
SELECT COUNT(*) as sms_count FROM sms_logs WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';

-- Show recent communications
SELECT 'EMAIL' as type, subject as content, to_email as recipient, status, created_at 
FROM email_logs 
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'
UNION ALL
SELECT 'SMS' as type, message as content, to_phone as recipient, status, created_at 
FROM sms_logs 
WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'
ORDER BY created_at DESC;