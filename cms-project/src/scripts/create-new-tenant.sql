-- Script voor het aanmaken van een nieuwe tenant (klant) in je SaaS

-- Variabelen (pas deze aan voor elke nieuwe klant)
DO $$
DECLARE
    new_tenant_id UUID;
    new_tenant_name TEXT := 'Voorbeeld Bedrijf B.V.'; -- PAS DIT AAN
    new_tenant_domain TEXT := 'voorbeeldbedrijf.nl'; -- PAS DIT AAN
BEGIN
    -- 1. Maak nieuwe tenant aan
    INSERT INTO tenants (name, domain, settings)
    VALUES (new_tenant_name, new_tenant_domain, '{}')
    RETURNING id INTO new_tenant_id;
    
    RAISE NOTICE 'Nieuwe tenant aangemaakt: % met ID: %', new_tenant_name, new_tenant_id;
    
    -- 2. Voeg standaard BTW percentages toe
    INSERT INTO btw_percentages (tenant_id, percentage, description, is_default) 
    VALUES 
        (new_tenant_id, 0, 'Vrijgesteld van BTW', false),
        (new_tenant_id, 9, 'Verlaagd tarief', false),
        (new_tenant_id, 21, 'Standaard tarief', true);
    
    -- 3. Voeg standaard tags toe
    INSERT INTO tags (tenant_id, name, color) 
    VALUES 
        (new_tenant_id, 'Nieuw', '#3B82F6'),
        (new_tenant_id, 'Belangrijk', '#EF4444'),
        (new_tenant_id, 'Follow-up', '#F59E0B'),
        (new_tenant_id, 'Contract', '#10B981'),
        (new_tenant_id, 'Service', '#8B5CF6'),
        (new_tenant_id, 'Installatie', '#6366F1'),
        (new_tenant_id, 'Onderhoud', '#14B8A6'),
        (new_tenant_id, 'Offerte', '#F97316');
    
    -- 4. Voeg standaard pipeline stages toe
    INSERT INTO pipeline_stages (tenant_id, name, color, order_position)
    VALUES
        (new_tenant_id, 'Nieuw', '#3B82F6', 1),
        (new_tenant_id, 'Gekwalificeerd', '#10B981', 2),
        (new_tenant_id, 'Offerte', '#F59E0B', 3),
        (new_tenant_id, 'Onderhandeling', '#8B5CF6', 4),
        (new_tenant_id, 'Gewonnen', '#059669', 5),
        (new_tenant_id, 'Verloren', '#DC2626', 6);
    
    -- 5. Voeg standaard email templates toe
    INSERT INTO email_templates (tenant_id, name, subject, body, category) 
    VALUES 
        (
            new_tenant_id,
            'Welkom - Nieuwe Lead',
            'Welkom bij ' || new_tenant_name,
            E'Beste {{name}},\n\nBedankt voor uw interesse in ' || new_tenant_name || '. Wij helpen u graag verder.\n\nEen van onze specialisten neemt binnenkort contact met u op.\n\nMet vriendelijke groet,\n' || new_tenant_name,
            'welcome'
        ),
        (
            new_tenant_id,
            'Offerte Opvolging',
            'Uw offerte van ' || new_tenant_name,
            E'Beste {{name}},\n\nOnlangs hebben wij u een offerte gestuurd. Wij zijn benieuwd of u nog vragen heeft.\n\nMet vriendelijke groet,\n{{sales_person}}\n' || new_tenant_name,
            'sales'
        );
    
    RAISE NOTICE 'Standaard data toegevoegd voor tenant: %', new_tenant_name;
    
END $$;

-- Om een user aan deze tenant te koppelen, gebruik:
-- UPDATE profiles SET tenant_id = '[new_tenant_id]' WHERE id = '[user_id]';