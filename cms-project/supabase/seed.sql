-- Seed data for StayCool CRM local development
-- This file contains realistic test data for all tables

-- Set the default tenant ID (this should match the one in the migration)
DO $$
DECLARE
    v_tenant_id UUID := '80496bff-b559-4b80-9102-3a84afdaa616';
    v_user_id UUID := gen_random_uuid();
BEGIN
    -- Create a test user profile
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
        v_user_id,
        'admin@staycoolairco.nl',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;

    -- Create profile for the user
    INSERT INTO profiles (id, tenant_id, email, full_name, role)
    VALUES (
        v_user_id,
        v_tenant_id,
        'admin@staycoolairco.nl',
        'Admin User',
        'admin'
    ) ON CONFLICT DO NOTHING;
END $$;

-- Insert test companies
INSERT INTO companies (tenant_id, name, email, phone, website, address, city, postal_code, country) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'TechStart B.V.', 'info@techstart.nl', '+31 20 123 4567', 'www.techstart.nl', 'Keizersgracht 123', 'Amsterdam', '1015 CJ', 'Nederland'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Hotel Luxe', 'reception@hotelluxe.nl', '+31 70 234 5678', 'www.hotelluxe.nl', 'Lange Voorhout 45', 'Den Haag', '2514 EC', 'Nederland'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Sportcentrum Fit', 'info@sportcentrumfit.nl', '+31 10 345 6789', 'www.sportcentrumfit.nl', 'Coolsingel 78', 'Rotterdam', '3011 AD', 'Nederland'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Restaurant Bella Vista', 'reserveren@bellavista.nl', '+31 30 456 7890', 'www.bellavista.nl', 'Oudegracht 200', 'Utrecht', '3511 NR', 'Nederland'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Kantoor Modern', 'admin@kantoormodern.nl', '+31 40 567 8901', 'www.kantoormodern.nl', 'Strijpsebaan 18', 'Eindhoven', '5616 GL', 'Nederland')
ON CONFLICT DO NOTHING;

-- Insert test leads with realistic Dutch data
INSERT INTO leads (tenant_id, name, email, phone, company, status, source, value, notes, city, street, house_number, postal_code, country, tags, retry_count) VALUES
    -- New leads
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Jan van der Berg', 'jan@bakkerijvanderberg.nl', '+31 6 1234 5678', 'Bakkerij van der Berg', 'new', 'Website', 15000, 'Nieuwe aanvraag voor koeling bakkerij', 'Amsterdam', 'Damrak', '75', '1012 LG', 'Nederland', '["horeca", "koeling"]', 0),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Sophie de Wit', 'sophie@kapsalondewit.nl', '+31 6 2345 6789', 'Kapsalon De Wit', 'new', 'Cold Call', 8000, 'Kleine salon, 3 stoelen', 'Rotterdam', 'Meent', '92', '3011 JH', 'Nederland', '["klein-bedrijf", "retail"]', 0),
    
    -- Contacted leads with retry history
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Peter Jansen', 'peter@autobedrijfjansen.nl', '+31 6 3456 7890', 'Autobedrijf Jansen', 'contacted', 'Referral', 25000, 'Grote werkplaats, showroom koeling nodig\n[22-8-2025] Poging 1 - Geen gehoor\n[23-8-2025] Poging 2 - Terugbellen volgende week', 'Utrecht', 'Cartesiusweg', '150', '3534 BD', 'Nederland', '["automotive", "groot-project"]', 2),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Linda Bakker', 'linda@yogastudiozen.nl', '+31 6 4567 8901', 'Yoga Studio Zen', 'contacted', 'Social Media', 12000, 'Klimaatbeheersing voor yoga ruimtes', 'Den Haag', 'Frederikstraat', '24', '2514 LK', 'Nederland', '["wellness", "klimaat"]', 0),
    
    -- Qualified leads
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Thomas Visser', 'thomas@serverroomspecialist.nl', '+31 6 5678 9012', 'Server Room Specialist', 'qualified', 'Partner', 45000, 'Precisie koeling voor serverruimte, 24/7 monitoring', 'Eindhoven', 'High Tech Campus', '1', '5656 AE', 'Nederland', '["tech", "kritisch", "24-7"]', 0),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Emma Smit', 'emma@boutiqueemma.nl', '+31 6 6789 0123', 'Boutique Emma', 'qualified', 'Website', 10000, 'Airco voor winkel en opslag', 'Maastricht', 'Grote Staat', '45', '6211 CW', 'Nederland', '["retail", "fashion"]', 1),
    
    -- Proposal stage
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Robert de Vries', 'robert@hotelcentraal.nl', '+31 6 7890 1234', 'Hotel Centraal', 'proposal', 'Trade Show', 75000, 'Complete HVAC systeem voor 50 kamers', 'Amsterdam', 'Damrak', '1-5', '1012 LG', 'Nederland', '["hotel", "groot-project", "urgente"]', 0),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Anna Hendriks', 'anna@medischcentrum.nl', '+31 6 8901 2345', 'Medisch Centrum West', 'proposal', 'Referral', 120000, 'Cleanroom installatie, speciale filters', 'Groningen', 'Hanzeplein', '1', '9713 GZ', 'Nederland', '["medisch", "cleanroom", "kritisch"]', 0),
    
    -- Won deals
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Michael van Dijk', 'michael@supermarktplus.nl', '+31 6 9012 3456', 'Supermarkt Plus', 'won', 'Cold Call', 35000, 'Koeling voor nieuwe filiaal - CONTRACT GETEKEND', 'Tilburg', 'Heuvelring', '222', '5038 CL', 'Nederland', '["retail", "food", "koeling"]', 0),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Sarah Meijer', 'sarah@fitnessfirst.nl', '+31 6 0123 4567', 'Fitness First', 'won', 'Website', 28000, 'Klimaatsysteem voor nieuwe sportschool', 'Breda', 'Ginnekenweg', '150', '4818 JK', 'Nederland', '["sport", "wellness", "klimaat"]', 0),
    
    -- Lost deals
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'David Bos', 'david@cafedavid.nl', '+31 6 1234 5679', 'Cafe David', 'lost', 'Walk-in', 6000, 'Budget te laag, gekozen voor goedkoper alternatief', 'Haarlem', 'Grote Markt', '21', '2011 RD', 'Nederland', '["horeca", "klein-budget"]', 3),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Lisa van Leeuwen', 'lisa@tandartsvanleeuwen.nl', '+31 6 2345 6780', 'Tandarts van Leeuwen', 'lost', 'Referral', 18000, 'Project uitgesteld tot volgend jaar', 'Nijmegen', 'Marienburg', '75', '6511 PS', 'Nederland', '["medisch", "uitgesteld"]', 1)
ON CONFLICT DO NOTHING;

-- Insert test contacts (converted from leads)
INSERT INTO contacts (tenant_id, name, email, phone, company_name, position, status, city, street, house_number, postal_code, country, notes, converted_from_lead_id) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Michael van Dijk', 'michael@supermarktplus.nl', '+31 6 9012 3456', 'Supermarkt Plus', 'Eigenaar', 'active', 'Tilburg', 'Heuvelring', '222', '5038 CL', 'Nederland', 'Goede klant, regelmatig onderhoud', (SELECT id FROM leads WHERE email = 'michael@supermarktplus.nl')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Sarah Meijer', 'sarah@fitnessfirst.nl', '+31 6 0123 4567', 'Fitness First', 'Manager', 'active', 'Breda', 'Ginnekenweg', '150', '4818 JK', 'Nederland', 'Onderhoudscontract afgesloten', (SELECT id FROM leads WHERE email = 'sarah@fitnessfirst.nl')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Johan Peters', 'johan@officespace.nl', '+31 6 5555 1234', 'Office Space B.V.', 'Facility Manager', 'active', 'Amsterdam', 'Zuidas', '100', '1082 MS', 'Nederland', 'Bestaande klant, 5 jaar contract', NULL),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Marieke de Jong', 'marieke@schooldejong.nl', '+31 6 5555 5678', 'Basisschool De Jong', 'Directeur', 'active', 'Utrecht', 'Schoolstraat', '1', '3581 XK', 'Nederland', 'Onderhoud schoolgebouw', NULL)
ON CONFLICT DO NOTHING;

-- Insert test customers
INSERT INTO customers (tenant_id, name, email, phone, company, status, total_deals, total_value) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Supermarkt Plus', 'michael@supermarktplus.nl', '+31 6 9012 3456', 'Supermarkt Plus', 'active', 1, 35000),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Fitness First', 'sarah@fitnessfirst.nl', '+31 6 0123 4567', 'Fitness First', 'active', 1, 28000),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Office Space B.V.', 'johan@officespace.nl', '+31 6 5555 1234', 'Office Space B.V.', 'active', 3, 125000),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Basisschool De Jong', 'marieke@schooldejong.nl', '+31 6 5555 5678', 'Basisschool De Jong', 'active', 2, 45000)
ON CONFLICT DO NOTHING;

-- Insert test products
INSERT INTO products (tenant_id, name, description, price, unit, sku, btw_percentage_id) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Airco Unit - Klein', 'Geschikt voor ruimtes tot 25m', 1250.00, 'stuk', 'AC-KL-001', (SELECT id FROM btw_percentages WHERE percentage = 21 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Airco Unit - Medium', 'Geschikt voor ruimtes 25-50m', 2150.00, 'stuk', 'AC-MD-001', (SELECT id FROM btw_percentages WHERE percentage = 21 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Airco Unit - Groot', 'Geschikt voor ruimtes 50-100m', 3500.00, 'stuk', 'AC-GR-001', (SELECT id FROM btw_percentages WHERE percentage = 21 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Installatie - Basis', 'Standaard installatie, inclusief materiaal', 450.00, 'stuk', 'INST-BAS', (SELECT id FROM btw_percentages WHERE percentage = 9 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Installatie - Complex', 'Complexe installatie, inclusief leidingwerk', 850.00, 'stuk', 'INST-CMP', (SELECT id FROM btw_percentages WHERE percentage = 9 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Onderhoudscontract - Jaar', 'Jaarlijks onderhoud, 2x per jaar', 350.00, 'jaar', 'OND-JAAR', (SELECT id FROM btw_percentages WHERE percentage = 21 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Spoedservice', 'Reparatie binnen 4 uur', 150.00, 'uur', 'SPOED-001', (SELECT id FROM btw_percentages WHERE percentage = 21 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Filter vervangen', 'Inclusief nieuwe filter', 75.00, 'stuk', 'FILT-001', (SELECT id FROM btw_percentages WHERE percentage = 21 AND tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616'))
ON CONFLICT DO NOTHING;

-- Insert test invoices
INSERT INTO invoices (tenant_id, invoice_number, invoice_type, status, customer_name, customer_email, customer_company, issue_date, due_date, subtotal, tax_amount, total_amount, notes) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', '2025-001', 'invoice', 'paid', 'Michael van Dijk', 'michael@supermarktplus.nl', 'Supermarkt Plus', '2025-01-15', '2025-02-15', 4950.00, 1039.50, 5989.50, 'Installatie nieuwe airco units'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', '2025-002', 'quote', 'sent', 'Robert de Vries', 'robert@hotelcentraal.nl', 'Hotel Centraal', '2025-08-20', '2025-09-20', 75000.00, 15750.00, 90750.00, 'Offerte complete HVAC systeem'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', '2025-003', 'invoice', 'sent', 'Sarah Meijer', 'sarah@fitnessfirst.nl', 'Fitness First', '2025-08-01', '2025-09-01', 7650.00, 1606.50, 9256.50, 'Eerste fase installatie'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', '2025-004', 'invoice', 'draft', 'Johan Peters', 'johan@officespace.nl', 'Office Space B.V.', CURRENT_DATE, CURRENT_DATE + 30, 350.00, 73.50, 423.50, 'Jaarlijks onderhoud')
ON CONFLICT DO NOTHING;

-- Insert invoice items for the invoices
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, btw_percentage, btw_amount, total_amount, sort_order) VALUES
    -- Invoice 2025-001
    ((SELECT id FROM invoices WHERE invoice_number = '2025-001'), 'Airco Unit - Medium', 2, 2150.00, 21, 903.00, 5203.00, 1),
    ((SELECT id FROM invoices WHERE invoice_number = '2025-001'), 'Installatie - Basis', 2, 450.00, 9, 81.00, 981.00, 2),
    ((SELECT id FROM invoices WHERE invoice_number = '2025-001'), 'Extra leidingwerk', 1, 150.00, 21, 31.50, 181.50, 3),
    
    -- Quote 2025-002
    ((SELECT id FROM invoices WHERE invoice_number = '2025-002'), 'Airco Unit - Groot', 15, 3500.00, 21, 11025.00, 63525.00, 1),
    ((SELECT id FROM invoices WHERE invoice_number = '2025-002'), 'Installatie - Complex', 15, 850.00, 9, 1147.50, 13897.50, 2),
    ((SELECT id FROM invoices WHERE invoice_number = '2025-002'), 'Centrale besturing systeem', 1, 8500.00, 21, 1785.00, 10285.00, 3),
    ((SELECT id FROM invoices WHERE invoice_number = '2025-002'), 'Projectmanagement', 1, 2500.00, 21, 525.00, 3025.00, 4),
    
    -- Invoice 2025-003
    ((SELECT id FROM invoices WHERE invoice_number = '2025-003'), 'Airco Unit - Medium', 3, 2150.00, 21, 1354.50, 7804.50, 1),
    ((SELECT id FROM invoices WHERE invoice_number = '2025-003'), 'Installatie - Basis', 3, 450.00, 9, 121.50, 1471.50, 2),
    
    -- Invoice 2025-004
    ((SELECT id FROM invoices WHERE invoice_number = '2025-004'), 'Onderhoudscontract - Jaar', 1, 350.00, 21, 73.50, 423.50, 1)
ON CONFLICT DO NOTHING;

-- Insert test appointments
INSERT INTO appointments (tenant_id, title, description, location, start_time, end_time, type, status, lead_id, contact_id) VALUES
    -- Today's appointments
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Intake gesprek - Bakkerij van der Berg', 'Bespreken koeling mogelijkheden', 'Damrak 75, Amsterdam', CURRENT_DATE + TIME '10:00', CURRENT_DATE + TIME '11:00', 'meeting', 'scheduled', (SELECT id FROM leads WHERE company = 'Bakkerij van der Berg'), NULL),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Onderhoud - Office Space', 'Regulier onderhoud alle units', 'Zuidas 100, Amsterdam', CURRENT_DATE + TIME '14:00', CURRENT_DATE + TIME '16:00', 'service', 'scheduled', NULL, (SELECT id FROM contacts WHERE company_name = 'Office Space B.V.')),
    
    -- Tomorrow
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Offerte presentatie - Hotel Centraal', 'Presentatie HVAC systeem', 'Hotel Centraal, Amsterdam', CURRENT_DATE + INTERVAL '1 day' + TIME '09:30', CURRENT_DATE + INTERVAL '1 day' + TIME '10:30', 'meeting', 'scheduled', (SELECT id FROM leads WHERE company = 'Hotel Centraal'), NULL),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Technische inspectie - Medisch Centrum', 'Inspectie voor cleanroom offerte', 'Hanzeplein 1, Groningen', CURRENT_DATE + INTERVAL '1 day' + TIME '13:00', CURRENT_DATE + INTERVAL '1 day' + TIME '15:00', 'inspection', 'scheduled', (SELECT id FROM leads WHERE company = 'Medisch Centrum West'), NULL),
    
    -- Next week
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Follow-up call - Yoga Studio', 'Nabespreken offerte', 'Telefonisch', CURRENT_DATE + INTERVAL '7 days' + TIME '11:00', CURRENT_DATE + INTERVAL '7 days' + TIME '11:30', 'call', 'scheduled', (SELECT id FROM leads WHERE company = 'Yoga Studio Zen'), NULL),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Installatie - Fitness First Fase 2', 'Installatie overige units', 'Ginnekenweg 150, Breda', CURRENT_DATE + INTERVAL '5 days' + TIME '08:00', CURRENT_DATE + INTERVAL '5 days' + TIME '17:00', 'installation', 'scheduled', NULL, (SELECT id FROM contacts WHERE company_name = 'Fitness First')),
    
    -- Completed appointments
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Eerste gesprek - Supermarkt Plus', 'Succesvolle intake', 'Tilburg', CURRENT_DATE - INTERVAL '30 days' + TIME '10:00', CURRENT_DATE - INTERVAL '30 days' + TIME '11:00', 'meeting', 'completed', NULL, (SELECT id FROM contacts WHERE company_name = 'Supermarkt Plus')),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Installatie - Supermarkt Plus', 'Complete installatie', 'Tilburg', CURRENT_DATE - INTERVAL '20 days' + TIME '08:00', CURRENT_DATE - INTERVAL '20 days' + TIME '17:00', 'installation', 'completed', NULL, (SELECT id FROM contacts WHERE company_name = 'Supermarkt Plus'))
ON CONFLICT DO NOTHING;

-- Insert test campaigns
INSERT INTO campaigns (tenant_id, name, description, type, status, start_date, end_date, budget) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Zomer Airco Actie 2025', 'Korting op airco installaties in de zomer', 'promotion', 'active', '2025-06-01', '2025-08-31', 5000.00),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Google Ads - Airco Service', 'Google advertentie campagne voor service', 'digital', 'active', '2025-01-01', '2025-12-31', 12000.00),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'LinkedIn B2B Campaign', 'Targeting facility managers', 'social', 'draft', '2025-09-01', '2025-11-30', 3000.00)
ON CONFLICT DO NOTHING;

-- Insert test email templates
INSERT INTO email_templates (tenant_id, name, subject, body, category) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Welkom Email', 'Welkom bij StayCool AirCo', 'Beste {{name}},\n\nBedankt voor uw interesse in StayCool AirCo. Wij zijn specialist in klimaatbeheersing.\n\nMet vriendelijke groet,\nStayCool Team', 'welcome'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Offerte Follow-up', 'Uw offerte van StayCool', 'Beste {{name}},\n\nHeeft u onze offerte goed ontvangen? Wij beantwoorden graag eventuele vragen.\n\nMet vriendelijke groet,\nStayCool Team', 'sales'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Onderhouds Herinnering', 'Tijd voor onderhoud', 'Beste {{name}},\n\nHet is weer tijd voor het onderhoud van uw airco systeem. Neem contact op voor een afspraak.\n\nMet vriendelijke groet,\nStayCool Team', 'service')
ON CONFLICT DO NOTHING;

-- Insert test workflows
INSERT INTO workflows (tenant_id, name, description, trigger_type, status) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Lead Nurturing Flow', 'Automatische emails naar nieuwe leads', 'lead_created', 'active'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Geen Gehoor Follow-up', 'Follow-up na 3x geen gehoor', 'manual', 'active'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Onderhouds Campagne', 'Jaarlijkse onderhouds reminders', 'scheduled', 'draft')
ON CONFLICT DO NOTHING;

-- Insert test pipeline stages
INSERT INTO pipeline_stages (tenant_id, name, color, order_position) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Nieuw', '#3B82F6', 1),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Contact Gemaakt', '#10B981', 2),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Gekwalificeerd', '#F59E0B', 3),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Offerte', '#8B5CF6', 4),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Gewonnen', '#059669', 5),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'Verloren', '#DC2626', 6)
ON CONFLICT DO NOTHING;

-- Insert test tags
INSERT INTO tags (tenant_id, name, color) VALUES
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'horeca', '#10B981'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'retail', '#3B82F6'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'kantoor', '#6366F1'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'medisch', '#EF4444'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'sport', '#F59E0B'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'urgent', '#DC2626'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'groot-project', '#8B5CF6'),
    ('80496bff-b559-4b80-9102-3a84afdaa616', 'klein-budget', '#6B7280')
ON CONFLICT DO NOTHING;

-- Update lead search vectors
UPDATE leads SET search_fts = to_tsvector('dutch', 
    COALESCE(name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(company, '') || ' ' || 
    COALESCE(city, '')
);

-- Display summary
DO $$
BEGIN
    RAISE NOTICE 'Seed data loaded successfully!';
    RAISE NOTICE '- Companies: 5';
    RAISE NOTICE '- Leads: 12 (various stages)';
    RAISE NOTICE '- Contacts: 4';
    RAISE NOTICE '- Customers: 4';
    RAISE NOTICE '- Products: 8';
    RAISE NOTICE '- Invoices: 4';
    RAISE NOTICE '- Appointments: 8';
    RAISE NOTICE '- Email Templates: 3';
    RAISE NOTICE '- Campaigns: 3';
    RAISE NOTICE '- Workflows: 3';
    RAISE NOTICE '- Pipeline Stages: 6';
    RAISE NOTICE '- Tags: 8';
END $$;