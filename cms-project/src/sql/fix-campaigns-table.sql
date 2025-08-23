-- Fix Campaigns Table - Voeg missende kolommen toe

-- 1. Check eerst welke kolommen al bestaan
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaigns'
ORDER BY ordinal_position;

-- 2. Voeg alle missende kolommen toe (IF NOT EXISTS voorkomt errors)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS preview_text VARCHAR(255),
ADD COLUMN IF NOT EXISTS from_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS from_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS reply_to_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS content_text TEXT,
ADD COLUMN IF NOT EXISTS template_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS segment_type VARCHAR(50) DEFAULT 'all',
ADD COLUMN IF NOT EXISTS segment_filters JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS recipient_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unsubscribed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complained_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS open_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounce_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Update NOT NULL constraints waar nodig (alleen als kolom bestaat)
DO $$
BEGIN
  -- Check of kolom bestaat voordat we constraint toevoegen
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'campaigns' 
             AND column_name = 'name') THEN
    ALTER TABLE campaigns ALTER COLUMN name SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'campaigns' 
             AND column_name = 'subject') THEN
    ALTER TABLE campaigns ALTER COLUMN subject SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'campaigns' 
             AND column_name = 'from_name') THEN
    ALTER TABLE campaigns ALTER COLUMN from_name SET NOT NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'campaigns' 
             AND column_name = 'from_email') THEN
    ALTER TABLE campaigns ALTER COLUMN from_email SET NOT NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Negeer errors voor NOT NULL constraints op bestaande data
    NULL;
END $$;

-- 4. Check de nieuwe structuur
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaigns'
ORDER BY ordinal_position;

-- 5. Maak andere tabellen als ze nog niet bestaan
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

CREATE TABLE IF NOT EXISTS campaign_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  tracking_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  unique_click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- 6. Maak indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- 7. Test insert met alleen bestaande kolommen
INSERT INTO campaigns (
  id,
  tenant_id,
  name,
  subject,
  from_name,
  from_email,
  status
) 
SELECT
  gen_random_uuid(),
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Test Campaign Setup',
  'Test Email',
  'StayCool',
  'info@staycoolairco.nl',
  'draft'
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE name = 'Test Campaign Setup'
);

-- 8. Succes bericht
SELECT 'Campaigns tabel is nu compleet!' as status;