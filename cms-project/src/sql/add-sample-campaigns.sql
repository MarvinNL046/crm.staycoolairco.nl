-- Voeg sample campaigns toe voor StayCool CRM

-- 1. Verzonden campagne met goede stats
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
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Zomer Airco Actie 2024',
  '☀️ 20% Korting op alle Airco installaties',
  'Bereid je voor op de zomer met onze speciale aanbieding',
  'StayCool Airco',
  'info@staycoolairco.nl',
  '<h1>Zomer Actie!</h1><p>Profiteer van 20% korting op alle airco installaties.</p><p>Deze aanbieding is geldig tot eind juni.</p><a href="https://staycoolairco.nl/actie">Bekijk de actie</a>',
  'Zomer Actie! Profiteer van 20% korting op alle airco installaties. Deze aanbieding is geldig tot eind juni.',
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
) ON CONFLICT DO NOTHING;

-- 2. Onderhouds campagne
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
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Onderhoudsherinnering Q2 2024',
  'Tijd voor uw jaarlijkse airco onderhoud',
  'Houd uw airco in topconditie met regelmatig onderhoud',
  'StayCool Service',
  'service@staycoolairco.nl',
  '<h1>Onderhoudsherinnering</h1><p>Het is tijd voor uw jaarlijkse airco onderhoud.</p><p>Een goed onderhouden airco:</p><ul><li>Verbruikt minder energie</li><li>Gaat langer mee</li><li>Werkt efficiënter</li></ul>',
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
) ON CONFLICT DO NOTHING;

-- 3. Geplande nieuwsbrief
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
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Nieuwsbrief April 2024',
  'Nieuwe producten en tips voor optimaal comfort',
  'Ontdek onze laatste innovaties en besparingstips',
  'StayCool Airco',
  'nieuwsbrief@staycoolairco.nl',
  '<h1>Nieuwsbrief April</h1><p>Ontdek onze nieuwe smart home integraties.</p>',
  'Nieuwsbrief April - Ontdek onze nieuwe smart home integraties.',
  'email',
  'scheduled',
  'all',
  412,
  NOW() + INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

-- 4. Concept welkomst email
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
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Welkom nieuwe klanten',
  'Welkom bij StayCool - Uw comfort is onze prioriteit',
  'Bedankt voor uw vertrouwen in StayCool',
  'StayCool Team',
  'welkom@staycoolairco.nl',
  '<h1>Welkom bij StayCool!</h1><p>Bedankt voor het kiezen van StayCool voor uw airconditioning behoeften.</p><p>Als nieuwe klant ontvangt u:</p><ul><li>10% korting op uw eerste onderhoud</li><li>Gratis energie-besparingstips</li><li>24/7 support</li></ul>',
  'Welkom bij StayCool! Bedankt voor het kiezen van StayCool.',
  'email',
  'draft',
  'custom',
  0
) ON CONFLICT DO NOTHING;

-- 5. Recent verzonden promo
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
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Flash Sale - 48 uur korting',
  '⚡ 48 uur MEGA korting op geselecteerde modellen',
  'Mis deze kans niet - alleen dit weekend!',
  'StayCool Deals',
  'deals@staycoolairco.nl',
  '<h1>Flash Sale!</h1><p>Alleen dit weekend: tot 30% korting op geselecteerde airco modellen.</p>',
  'Flash Sale! Alleen dit weekend: tot 30% korting.',
  'email',
  'sent',
  'all',
  523,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
  523,
  512,
  312,
  156,
  60.92,
  30.47
) ON CONFLICT DO NOTHING;

-- 6. Feestdagen groet
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
) VALUES (
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Fijne Feestdagen 2024',
  '🎄 Fijne feestdagen van het StayCool team',
  'Wij wensen u warme feestdagen en een koel 2025',
  'StayCool Team',
  'info@staycoolairco.nl',
  '<h1>Fijne Feestdagen!</h1><p>Het hele StayCool team wenst u fijne feestdagen en een geweldig 2025!</p>',
  'Fijne Feestdagen! Het hele StayCool team wenst u fijne feestdagen.',
  'email',
  'draft',
  'all',
  0
) ON CONFLICT DO NOTHING;

-- Check resultaat
SELECT 
  name,
  status,
  recipient_count,
  CASE 
    WHEN status = 'sent' THEN 'Verzonden op ' || TO_CHAR(sent_at, 'DD-MM-YYYY')
    WHEN status = 'scheduled' THEN 'Gepland voor ' || TO_CHAR(scheduled_at, 'DD-MM-YYYY')
    ELSE 'Concept'
  END as status_info
FROM campaigns
ORDER BY created_at DESC;