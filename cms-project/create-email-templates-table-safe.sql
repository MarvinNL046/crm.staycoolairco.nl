-- Safe version: Create email_templates table for CRM email template management
-- This version checks if table exists and handles missing columns

-- Drop existing table if it exists (safe because we'll recreate it)
DROP TABLE IF EXISTS email_templates CASCADE;

-- Create email_templates table
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'lead_welcome', 'appointment_confirmation', 'invoice_sent', 'follow_up', 'quote_sent'
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '{}', -- Available template variables
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Users can only see templates for their tenant
CREATE POLICY "Users can view templates for their tenant" ON email_templates
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Users can create templates for their tenant
CREATE POLICY "Users can create templates for their tenant" ON email_templates
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Users can update templates for their tenant
CREATE POLICY "Users can update templates for their tenant" ON email_templates
    FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Users can delete templates for their tenant
CREATE POLICY "Users can delete templates for their tenant" ON email_templates
    FOR DELETE USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Create indexes for performance
CREATE INDEX idx_email_templates_tenant_id ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- Insert default email templates for existing tenants
INSERT INTO email_templates (tenant_id, name, subject, template_type, html_content, text_content, variables, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Welkom Nieuwe Lead',
    'Welkom bij StayCool Air Conditioning',
    'lead_welcome',
    '<html><body><h1>Welkom {{lead_name}}!</h1><p>Bedankt voor uw interesse in onze airconditioning diensten.</p><p>Wij nemen binnen 24 uur contact met u op.</p><p>Met vriendelijke groet,<br>{{company_name}}</p></body></html>',
    'Welkom {{lead_name}}!\n\nBedankt voor uw interesse in onze airconditioning diensten.\n\nWij nemen binnen 24 uur contact met u op.\n\nMet vriendelijke groet,\n{{company_name}}',
    '{"lead_name": "Naam van de lead", "company_name": "Bedrijfsnaam", "contact_person": "Contactpersoon"}',
    true,
    true
FROM tenants t;

INSERT INTO email_templates (tenant_id, name, subject, template_type, html_content, text_content, variables, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Afspraak Bevestiging',
    'Afspraak bevestigd: {{appointment_date}}',
    'appointment_confirmation',
    '<html><body><h1>Afspraak Bevestigd</h1><p>Beste {{customer_name}},</p><p>Uw afspraak is bevestigd voor <strong>{{appointment_date}}</strong> om <strong>{{appointment_time}}</strong>.</p><p>Locatie: {{appointment_address}}</p><p>Tot ziens!</p><p>{{company_name}}</p></body></html>',
    'Afspraak Bevestigd\n\nBeste {{customer_name}},\n\nUw afspraak is bevestigd voor {{appointment_date}} om {{appointment_time}}.\n\nLocatie: {{appointment_address}}\n\nTot ziens!\n\n{{company_name}}',
    '{"customer_name": "Klantnaam", "appointment_date": "Afspraak datum", "appointment_time": "Afspraak tijd", "appointment_address": "Adres", "company_name": "Bedrijfsnaam"}',
    true,
    true
FROM tenants t;

INSERT INTO email_templates (tenant_id, name, subject, template_type, html_content, text_content, variables, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Factuur Verzonden',
    'Factuur {{invoice_number}} van {{company_name}}',
    'invoice_sent',
    '<html><body><h1>Factuur {{invoice_number}}</h1><p>Beste {{customer_name}},</p><p>Bijgevoegd treft u factuur {{invoice_number}} aan voor een bedrag van <strong>€{{invoice_total}}</strong>.</p><p>Gelieve dit binnen {{payment_terms}} dagen te voldoen.</p><p>Met vriendelijke groet,<br>{{company_name}}</p></body></html>',
    'Factuur {{invoice_number}}\n\nBeste {{customer_name}},\n\nBijgevoegd treft u factuur {{invoice_number}} aan voor een bedrag van €{{invoice_total}}.\n\nGelieve dit binnen {{payment_terms}} dagen te voldoen.\n\nMet vriendelijke groet,\n{{company_name}}',
    '{"customer_name": "Klantnaam", "invoice_number": "Factuurnummer", "invoice_total": "Totaalbedrag", "payment_terms": "Betalingstermijn", "company_name": "Bedrijfsnaam"}',
    true,
    true
FROM tenants t;

INSERT INTO email_templates (tenant_id, name, subject, template_type, html_content, text_content, variables, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Offerte Verzonden',
    'Offerte {{quote_number}} voor uw airconditioning',
    'quote_sent',
    '<html><body><h1>Offerte {{quote_number}}</h1><p>Beste {{customer_name}},</p><p>Bijgevoegd treft u onze offerte aan voor de installatie van airconditioning.</p><p>Totaal: <strong>€{{quote_total}}</strong></p><p>Deze offerte is geldig tot {{valid_until}}.</p><p>Voor vragen kunt u contact met ons opnemen.</p><p>Met vriendelijke groet,<br>{{company_name}}</p></body></html>',
    'Offerte {{quote_number}}\n\nBeste {{customer_name}},\n\nBijgevoegd treft u onze offerte aan voor de installatie van airconditioning.\n\nTotaal: €{{quote_total}}\n\nDeze offerte is geldig tot {{valid_until}}.\n\nVoor vragen kunt u contact met ons opnemen.\n\nMet vriendelijke groet,\n{{company_name}}',
    '{"customer_name": "Klantnaam", "quote_number": "Offertenummer", "quote_total": "Totaalbedrag", "valid_until": "Geldig tot", "company_name": "Bedrijfsnaam"}',
    true,
    true
FROM tenants t;

INSERT INTO email_templates (tenant_id, name, subject, template_type, html_content, text_content, variables, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Follow-up Email',
    'Nog vragen over uw airconditioning?',
    'follow_up',
    '<html><body><h1>Hoe kunnen we u verder helpen?</h1><p>Beste {{customer_name}},</p><p>We wilden even checken of u nog vragen heeft over onze airconditioning diensten.</p><p>Heeft u interesse in een gratis adviesgesprek? Neem gerust contact met ons op!</p><p>Met vriendelijke groet,<br>{{contact_person}}<br>{{company_name}}</p></body></html>',
    'Hoe kunnen we u verder helpen?\n\nBeste {{customer_name}},\n\nWe wilden even checken of u nog vragen heeft over onze airconditioning diensten.\n\nHeeft u interesse in een gratis adviesgesprek? Neem gerust contact met ons op!\n\nMet vriendelijke groet,\n{{contact_person}}\n{{company_name}}',
    '{"customer_name": "Klantnaam", "contact_person": "Contactpersoon", "company_name": "Bedrijfsnaam"}',
    true,
    true
FROM tenants t;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE
    ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();