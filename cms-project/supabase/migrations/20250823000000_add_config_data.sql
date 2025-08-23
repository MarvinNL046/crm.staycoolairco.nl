-- Add missing configuration data to production database
-- This migration adds BTW percentages, tags, and email templates

-- First check if we have any BTW percentages
DO $$
DECLARE
    btw_count INTEGER;
    tag_count INTEGER;
    template_count INTEGER;
BEGIN
    -- Count existing BTW percentages
    SELECT COUNT(*) INTO btw_count FROM btw_percentages WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';
    
    IF btw_count = 0 THEN
        INSERT INTO btw_percentages (tenant_id, percentage, description, is_default) 
        VALUES 
            ('80496bff-b559-4b80-9102-3a84afdaa616', 0, 'Vrijgesteld van BTW', false),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 9, 'Verlaagd tarief', false),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 21, 'Standaard tarief', true);
        
        RAISE NOTICE 'Added 3 BTW percentages';
    ELSE
        RAISE NOTICE 'BTW percentages already exist';
    END IF;
    
    -- Count existing tags
    SELECT COUNT(*) INTO tag_count FROM tags WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';
    
    IF tag_count = 0 THEN
        INSERT INTO tags (tenant_id, name, color) 
        VALUES 
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Nieuw', '#3B82F6'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Belangrijk', '#EF4444'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Follow-up', '#F59E0B'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Contract', '#10B981'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Service', '#8B5CF6'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Installatie', '#6366F1'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Onderhoud', '#14B8A6'),
            ('80496bff-b559-4b80-9102-3a84afdaa616', 'Offerte', '#F97316');
        
        RAISE NOTICE 'Added 8 tags';
    ELSE
        RAISE NOTICE 'Tags already exist';
    END IF;
    
    -- Count existing email templates
    SELECT COUNT(*) INTO template_count FROM email_templates WHERE tenant_id = '80496bff-b559-4b80-9102-3a84afdaa616';
    
    IF template_count = 0 THEN
        INSERT INTO email_templates (tenant_id, name, subject, body, category) 
        VALUES 
            (
                '80496bff-b559-4b80-9102-3a84afdaa616',
                'Welkom - Nieuwe Lead',
                'Welkom bij StayCool Airconditioning',
                E'Beste {{name}},\n\nBedankt voor uw interesse in StayCool Airconditioning. Wij zijn specialist in klimaatbeheersing en helpen u graag met het vinden van de perfecte oplossing.\n\nEen van onze specialisten neemt binnenkort contact met u op om uw wensen te bespreken.\n\nMet vriendelijke groet,\nHet StayCool Team',
                'welcome'
            ),
            (
                '80496bff-b559-4b80-9102-3a84afdaa616',
                'Offerte Opvolging',
                'Uw offerte van StayCool - {{company}}',
                E'Beste {{name}},\n\nOnlangs hebben wij u een offerte gestuurd voor {{company}}. Wij zijn benieuwd of u nog vragen heeft over onze offerte.\n\nMocht u aanvullende informatie wensen of een afspraak willen maken, neem dan gerust contact met ons op.\n\nMet vriendelijke groet,\n{{sales_person}}\nStayCool Airconditioning',
                'sales'
            ),
            (
                '80496bff-b559-4b80-9102-3a84afdaa616',
                'Onderhouds Herinnering',
                'Tijd voor onderhoud - {{company}}',
                E'Beste {{name}},\n\nHet is weer tijd voor het periodieke onderhoud van uw airconditioning systeem bij {{company}}.\n\nRegelmatig onderhoud zorgt voor:\n- Optimale werking van uw systeem\n- Langere levensduur\n- Lagere energiekosten\n- Gezondere lucht\n\nNeem contact met ons op om een afspraak te plannen.\n\nMet vriendelijke groet,\nStayCool Service Team',
                'service'
            ),
            (
                '80496bff-b559-4b80-9102-3a84afdaa616',
                'Geen Gehoor - Follow Up',
                'We hebben u gemist - StayCool',
                E'Beste {{name}},\n\nWe hebben geprobeerd u telefonisch te bereiken, maar helaas zonder succes.\n\nUw aanvraag is belangrijk voor ons. U kunt ons bereiken op:\n- Telefoon: 0800-STAYCOOL\n- Email: info@staycoolairco.nl\n- Of reply op deze email\n\nWe horen graag van u!\n\nMet vriendelijke groet,\nStayCool Team',
                'follow-up'
            );
        
        RAISE NOTICE 'Added 4 email templates';
    ELSE
        RAISE NOTICE 'Email templates already exist';
    END IF;
END $$;