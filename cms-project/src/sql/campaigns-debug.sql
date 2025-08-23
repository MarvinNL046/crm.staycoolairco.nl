-- Debug: Check wat er bestaat voordat we beginnen

-- 1. Lijst alle tabellen
DO $$
BEGIN
  RAISE NOTICE 'Bestaande tabellen:';
  FOR r IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    RAISE NOTICE '  - %', r.table_name;
  END LOOP;
END $$;

-- 2. Check of campaigns tabel bestaat
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'Campaigns tabel bestaat al!';
    
    -- Toon bestaande kolommen
    RAISE NOTICE 'Bestaande kolommen in campaigns:';
    FOR r IN SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaigns'
    LOOP
      RAISE NOTICE '  - %', r.column_name;
    END LOOP;
  ELSE
    RAISE NOTICE 'Campaigns tabel bestaat nog niet, wordt aangemaakt...';
  END IF;
END $$;

-- 3. Drop oude campaigns tabellen als ze bestaan (OPTIONEEL - uncomment indien nodig)
-- DROP TABLE IF EXISTS campaign_clicks CASCADE;
-- DROP TABLE IF EXISTS campaign_links CASCADE;
-- DROP TABLE IF EXISTS campaign_recipients CASCADE;
-- DROP TABLE IF EXISTS campaigns CASCADE;

-- 4. Maak campaigns tabel alleen als deze niet bestaat
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    CREATE TABLE campaigns (
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
    
    RAISE NOTICE 'Campaigns tabel succesvol aangemaakt!';
  ELSE
    RAISE NOTICE 'Campaigns tabel bestaat al, wordt overgeslagen...';
  END IF;
END $$;

-- 5. Check of scheduled_at kolom bestaat, zo niet voeg toe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'scheduled_at') THEN
      ALTER TABLE campaigns ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
      RAISE NOTICE 'scheduled_at kolom toegevoegd aan campaigns tabel';
    ELSE
      RAISE NOTICE 'scheduled_at kolom bestaat al';
    END IF;
  END IF;
END $$;

-- 6. Maak andere tabellen
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

-- 7. Maak indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

-- 8. Eindbericht
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SETUP COMPLEET ===';
  RAISE NOTICE 'Campaigns module is klaar voor gebruik!';
  RAISE NOTICE '';
  RAISE NOTICE 'Test met: SELECT * FROM campaigns LIMIT 1;';
END $$;