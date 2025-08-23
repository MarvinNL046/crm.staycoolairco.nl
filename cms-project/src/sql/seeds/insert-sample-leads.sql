-- Insert sample leads data
-- Make sure to use the correct tenant_id from your tenants table
INSERT INTO leads (
  tenant_id,
  name,
  email,
  phone,
  company,
  city,
  status,
  source,
  value,
  notes,
  retry_count
) VALUES 
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Jan Janssen', 'jan@bakkerijjanssen.nl', '+31 6 1234 5678', 'Bakkerij Janssen', 'Amsterdam', 'new', 'Website', 15000, 'Geïnteresseerd in nieuwe airco voor winkel', 0),
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Maria de Groot', 'maria@restaurantgroen.nl', '+31 6 2345 6789', 'Restaurant Groen', 'Utrecht', 'qualified', 'Referral', 28500, 'Wil complete klimaatsysteem voor restaurant. Geen gehoor bij eerste poging.', 1),
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Peter van Dam', 'peter@hotelzonneschijn.nl', '+31 6 3456 7890', 'Hotel Zonneschijn', 'Rotterdam', 'proposal', 'Cold Call', 45000, 'Offerte verstuurd voor 20 kamers', 0),
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Lisa Smit', 'lisa@cafedehoek.nl', '+31 6 4567 8901', 'Café de Hoek', 'Den Haag', 'contacted', 'Social Media', 8500, 'Afspraak gepland voor volgende week', 0),
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Tom Bakker', 'tom@supermarktplus.nl', '+31 6 5678 9012', 'Supermarkt Plus', 'Eindhoven', 'new', 'Website', 22000, 'Vraag over koeling magazijn', 0),
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Sarah Johnson', 'sarah@fitlife.nl', '+31 6 6789 0123', 'Sportschool FitLife', 'Groningen', 'won', 'Referral', 18500, 'Contract getekend!', 0),
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Mark de Vries', 'mark@kantoordevries.nl', '+31 6 7890 1234', 'Kantoor De Vries', 'Tilburg', 'lost', 'Website', 12000, 'Gekozen voor concurrent', 0),
  -- Lead with specific ID for testing "geen gehoor" workflow (3 attempts)
  ('80496bff-b559-4b80-9102-3a84afdaa616', 'Emma Vermeer', 'emma@koffiehuisvermeer.nl', '+31 6 8901 2345', 'Koffiehuis Vermeer', 'Haarlem', 'qualified', 'Website', 9500, 'Geen gehoor - 3x geprobeerd', 3)
ON CONFLICT DO NOTHING;