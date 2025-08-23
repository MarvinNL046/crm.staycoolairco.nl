-- Email Campaigns Schema for StayCool CRM
-- Veilige versie die checkt of tabellen al bestaan

-- Drop existing tables if needed (uncomment if you want to reset)
-- DROP TABLE IF EXISTS campaign_clicks CASCADE;
-- DROP TABLE IF EXISTS campaign_links CASCADE;
-- DROP TABLE IF EXISTS campaign_recipients CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  -- Campaign basics
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  from_name VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255),
  
  -- Campaign content
  content_html TEXT,
  content_text TEXT,
  template_id VARCHAR(100),
  
  -- Campaign settings
  type VARCHAR(50) NOT NULL DEFAULT 'email',
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  
  -- Targeting
  segment_type VARCHAR(50) DEFAULT 'all',
  segment_filters JSONB DEFAULT '{}',
  recipient_count INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  
  -- Rates (calculated)
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_recipients table
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Recipient info
  contact_id UUID,
  lead_id UUID,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  first_clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  complained_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  bounce_type VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_links table for click tracking
CREATE TABLE IF NOT EXISTS campaign_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  
  original_url TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  unique_click_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_clicks table
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES campaign_links(id) ON DELETE CASCADE,
  
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  referer TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_links_campaign_id ON campaign_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign_id ON campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_recipient_id ON campaign_clicks(recipient_id);

-- Insert sample campaigns only if table is empty
INSERT INTO campaigns (
  tenant_id,
  name,
  subject,
  preview_text,
  from_name,
  from_email,
  content_html,
  content_text,
  type,
  status,
  segment_type,
  recipient_count,
  sent_at,
  completed_at,
  sent_count,
  delivered_count,
  opened_count,
  clicked_count,
  open_rate,
  click_rate
) 
SELECT
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Zomer Airco Actie 2024',
  '☀️ 20% Korting op alle Airco installaties',
  'Bereid je voor op de zomer met onze speciale aanbieding',
  'StayCool Airco',
  'info@staycoolairco.nl',
  '<h1>Zomer Actie!</h1><p>Profiteer van 20% korting op alle airco installaties.</p>',
  'Zomer Actie! Profiteer van 20% korting op alle airco installaties.',
  'email',
  'sent',
  'leads',
  245,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
  245,
  238,
  142,
  67,
  59.66,
  28.15
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'Zomer Airco Actie 2024'
);

INSERT INTO campaigns (
  tenant_id,
  name,
  subject,
  preview_text,
  from_name,
  from_email,
  content_html,
  content_text,
  type,
  status,
  segment_type,
  recipient_count,
  sent_at,
  completed_at,
  sent_count,
  delivered_count,
  opened_count,
  clicked_count,
  open_rate,
  click_rate
) 
SELECT
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Onderhoudsherinnering Q2',
  'Tijd voor uw jaarlijkse airco onderhoud',
  'Houd uw airco in topconditie',
  'StayCool Service',
  'service@staycoolairco.nl',
  '<h1>Onderhoudsherinnering</h1><p>Het is tijd voor uw jaarlijkse airco onderhoud.</p>',
  'Onderhoudsherinnering - Het is tijd voor uw jaarlijkse airco onderhoud.',
  'email',
  'sent',
  'customers',
  156,
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days' + INTERVAL '1 hour',
  156,
  154,
  98,
  45,
  63.64,
  29.22
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'Onderhoudsherinnering Q2'
);

INSERT INTO campaigns (
  tenant_id,
  name,
  subject,
  preview_text,
  from_name,
  from_email,
  content_html,
  content_text,
  type,
  status,
  segment_type,
  recipient_count,
  scheduled_at
) 
SELECT
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Nieuwsbrief April 2024',
  'Nieuwe producten en tips voor optimaal comfort',
  'Ontdek onze laatste innovaties',
  'StayCool Airco',
  'nieuwsbrief@staycoolairco.nl',
  '<h1>Nieuwsbrief April</h1><p>Ontdek onze nieuwe smart home integraties.</p>',
  'Nieuwsbrief April - Ontdek onze nieuwe smart home integraties.',
  'email',
  'scheduled',
  'all',
  412,
  NOW() + INTERVAL '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'Nieuwsbrief April 2024'
);

INSERT INTO campaigns (
  tenant_id,
  name,
  subject,
  preview_text,
  from_name,
  from_email,
  content_html,
  content_text,
  type,
  status,
  segment_type,
  recipient_count
) 
SELECT
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Welkom nieuwe klanten',
  'Welkom bij StayCool - Uw comfort is onze prioriteit',
  'Bedankt voor uw vertrouwen in StayCool',
  'StayCool Team',
  'welkom@staycoolairco.nl',
  '<h1>Welkom!</h1><p>Bedankt voor het kiezen van StayCool.</p>',
  'Welkom! Bedankt voor het kiezen van StayCool.',
  'email',
  'draft',
  'custom',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'Welkom nieuwe klanten'
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Campaigns tables created successfully!';
END $$;