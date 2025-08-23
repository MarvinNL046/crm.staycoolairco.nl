-- Insert sample appointments for testing
-- Using the same tenant_id as other sample data

INSERT INTO appointments (
  tenant_id,
  created_by,
  title,
  description,
  location,
  start_time,
  end_time,
  type,
  status,
  color,
  notes
) VALUES 
(
  '80496bff-b559-4b80-9102-3a84afdaa616',
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Offerte bespreking - Bakkerij Janssen',
  'Bespreken van airco installatie voor de bakkerij',
  'Bij klant - Amsterdam',
  NOW() + INTERVAL '1 day' + TIME '10:00',
  NOW() + INTERVAL '1 day' + TIME '11:00',
  'meeting',
  'scheduled',
  '#3B82F6',
  'Neem offerte mee en technische specificaties'
),
(
  '80496bff-b559-4b80-9102-3a84afdaa616',
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Installatie airco - Hotel Zonneschijn',
  'Complete installatie van 20 airco units',
  'Rotterdam - Hotel Zonneschijn',
  NOW() + INTERVAL '2 days' + TIME '09:00',
  NOW() + INTERVAL '2 days' + TIME '17:00',
  'installation',
  'scheduled',
  '#10B981',
  'Team van 3 monteurs nodig. Gereedschap en materialen zijn besteld.'
),
(
  '80496bff-b559-4b80-9102-3a84afdaa616',
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Service onderhoud - Restaurant Groen',
  'Jaarlijks onderhoud van klimaatsysteem',
  'Utrecht - Restaurant Groen',
  NOW() + INTERVAL '3 days' + TIME '14:00',
  NOW() + INTERVAL '3 days' + TIME '16:00',
  'service',
  'scheduled',
  '#F59E0B',
  'Filters vervangen, systeem controleren'
),
(
  '80496bff-b559-4b80-9102-3a84afdaa616',
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Telefonisch contact - Supermarkt Plus',
  'Opvolging offerte koeling magazijn',
  NULL,
  NOW() + INTERVAL '4 days' + TIME '11:00',
  NOW() + INTERVAL '4 days' + TIME '11:30',
  'call',
  'scheduled',
  '#8B5CF6',
  'Vragen naar beslissing over offerte'
),
(
  '80496bff-b559-4b80-9102-3a84afdaa616',
  '80496bff-b559-4b80-9102-3a84afdaa616',
  'Inspectie locatie - Koffiehuis Vermeer',
  'Bekijken locatie voor mogelijke installatie',
  'Haarlem - Centrum',
  NOW() + INTERVAL '5 days' + TIME '15:00',
  NOW() + INTERVAL '5 days' + TIME '16:30',
  'visit',
  'scheduled',
  '#EC4899',
  'Meetgereedschap meenemen, foto''s maken van huidige situatie'
)
ON CONFLICT DO NOTHING;