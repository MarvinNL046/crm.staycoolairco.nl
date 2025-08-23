-- ================================================================
-- MISSING TABLES CREATION SCRIPT
-- Phase 1: Communication & Foundation Tables for Staycool CRM
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
    
    -- Recipients
    to_email TEXT NOT NULL,
    to_name TEXT,
    from_email TEXT NOT NULL,
    from_name TEXT,
    cc_emails TEXT[], -- Array of CC emails
    bcc_emails TEXT[], -- Array of BCC emails
    
    -- References
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    
    -- Status & Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    provider TEXT, -- 'resend', 'sendgrid', 'gmail', etc.
    provider_message_id TEXT,
    error_message TEXT,
    
    -- Tracking Data
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT email_logs_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Add indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_id ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON email_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_contact_id ON email_logs(contact_id) WHERE contact_id IS NOT NULL;

-- 2. SMS_LOGS TABLE  
-- ================================================================
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- SMS Content
    message TEXT NOT NULL,
    
    -- Recipients
    to_phone TEXT NOT NULL,
    to_name TEXT,
    from_phone TEXT NOT NULL,
    
    -- References
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    
    -- Status & Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    provider TEXT, -- 'messagebird', 'twilio', etc.
    provider_message_id TEXT,
    error_message TEXT,
    
    -- Tracking Data
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Cost tracking
    cost_cents INTEGER, -- Cost in cents
    currency TEXT DEFAULT 'EUR',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT sms_logs_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Add indexes for sms_logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_tenant_id ON sms_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_phone ON sms_logs(to_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_lead_id ON sms_logs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_logs_contact_id ON sms_logs(contact_id) WHERE contact_id IS NOT NULL;

-- 3. ENHANCED PRODUCTS TABLE (if empty, add better structure)
-- ================================================================
-- First check if products table is truly empty and enhance it
INSERT INTO products (id, tenant_id, name, description, type, price, currency, is_active, created_at)
VALUES 
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Airconditioning Installatie', 'Complete installatie van airconditioning systeem inclusief materiaal en arbeid', 'service', 299900, 'EUR', true, NOW()),
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Airco Onderhoud', 'Jaarlijks onderhoudsbeurt voor optimale prestaties', 'service', 12500, 'EUR', true, NOW()),
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Airco Reparatie', 'Reparatie van defecte airconditioning', 'service', 15000, 'EUR', true, NOW()),
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Split-unit Daikin', 'Daikin split-unit airconditioning 3.5kW', 'product', 89900, 'EUR', true, NOW()),
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Multi-split systeem', 'Multi-split airconditioning systeem voor meerdere ruimtes', 'product', 179900, 'EUR', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. BASIC MESSAGE TEMPLATES
-- ================================================================
INSERT INTO message_templates (id, tenant_id, name, type, subject, body, is_active, created_at)
VALUES 
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Welkom Nieuwe Lead', 'email', 'Welkom bij Staycool Airconditioning!', 
     'Beste {{name}},

Bedankt voor uw interesse in onze airconditioning services! 

Wij nemen binnen 24 uur contact met u op om uw wensen te bespreken en een vrijblijvende offerte op te stellen.

Met vriendelijke groet,
Team Staycool Airconditioning

---
{{company_name}}
{{company_phone}}
{{company_email}}', true, NOW()),
    
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Offerte Follow-up', 'email', 'Uw airconditioning offerte van Staycool', 
     'Beste {{name}},

In de bijlage vindt u de besproken offerte voor uw airconditioning installatie.

De offerte is 30 dagen geldig. Heeft u nog vragen? Neem gerust contact op!

Met vriendelijke groet,
Team Staycool Airconditioning', true, NOW()),
    
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Afspraak Bevestiging', 'sms', '', 
     'Hallo {{name}}, uw afspraak voor airco installatie is bevestigd op {{appointment_date}} om {{appointment_time}}. Tot dan! - Staycool Airconditioning', true, NOW()),
    
    (gen_random_uuid(), '80496bff-b559-4b80-9102-3a84afdaa616', 'Onderhoud Reminder', 'email', 'Tijd voor uw jaarlijkse airco onderhoud', 
     'Beste {{name}},

Het is weer tijd voor het jaarlijkse onderhoud van uw airconditioning!

Regelmatig onderhoud zorgt voor:
- Optimale prestaties
- Langere levensduur 
- Energiebesparing
- Gezonde lucht

Plan nu uw onderhoudsbeurt in via onze website of bel ons direct.

Met vriendelijke groet,
Team Staycool Airconditioning', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON email_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_logs_updated_at BEFORE UPDATE ON sms_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================================
-- Enable RLS on new tables
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY "Users can only access their tenant's email logs" ON email_logs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Users can only access their tenant's sms logs" ON sms_logs  
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- Run these to verify everything was created correctly:

-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_logs', 'sms_logs')
ORDER BY table_name;

-- Check products count
SELECT COUNT(*) as product_count FROM products WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';

-- Check message templates count  
SELECT COUNT(*) as template_count FROM message_templates WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';

-- Show sample data
SELECT name, type, price/100.0 as price_euros FROM products WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616' LIMIT 3;
SELECT name, type, subject FROM message_templates WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616' LIMIT 3;