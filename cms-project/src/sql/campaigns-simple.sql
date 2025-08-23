-- Simple Campaign Tables Setup voor StayCool CRM

-- 1. Drop oude tabellen (alleen als je opnieuw wilt beginnen)
-- WAARSCHUWING: Dit verwijdert alle campaign data!
-- DROP TABLE IF EXISTS campaign_clicks CASCADE;
-- DROP TABLE IF EXISTS campaign_links CASCADE;  
-- DROP TABLE IF EXISTS campaign_recipients CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;

-- 2. Maak campaigns tabel
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
  
  -- Scheduling - DEZE KOLOM IS BELANGRIJK!
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
  
  -- Rates
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Als campaigns tabel al bestaat maar scheduled_at mist, voeg toe:
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 4. Maak recipient tracking tabel
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID,
  lead_id UUID,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  first_clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  complained_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  error_message TEXT,
  bounce_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Maak link tracking tabel
CREATE TABLE IF NOT EXISTS campaign_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  unique_click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Maak click tracking tabel
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

-- 7. Maak indexes voor performance
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);

-- 8. Test insert - een draft campaign
INSERT INTO campaigns (
  tenant_id,
  name,
  subject,
  preview_text,
  from_name,
  from_email,
  type,
  status,
  segment_type
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Test Campaign - ' || NOW()::text,
  'Test Onderwerp',
  'Test preview tekst',
  'StayCool Test',
  'test@staycoolairco.nl',
  'email',
  'draft',
  'all'
) ON CONFLICT DO NOTHING;

-- 9. Check of alles werkt
SELECT 
  'Campaigns tabel heeft ' || COUNT(*) || ' records' as status
FROM campaigns;

-- 10. Toon campaign structuur
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaigns'
AND column_name IN ('id', 'name', 'scheduled_at', 'sent_at', 'status')
ORDER BY ordinal_position;