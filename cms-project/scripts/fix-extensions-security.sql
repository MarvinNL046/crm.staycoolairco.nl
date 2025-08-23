-- Fix security warnings voor extensions in public schema
-- Dit verplaatst pg_trgm en unaccent naar een veilig extensions schema

-- 1. Maak een dedicated schema voor extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Geef de juiste permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. Verplaats pg_trgm extension
-- Eerst droppen uit public schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- Dan opnieuw aanmaken in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- 4. Verplaats unaccent extension
-- Eerst droppen uit public schema
DROP EXTENSION IF EXISTS unaccent CASCADE;

-- Dan opnieuw aanmaken in extensions schema  
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- 5. Update search_path zodat de extensions gevonden kunnen worden
-- Dit zorgt ervoor dat je de functies nog steeds kunt gebruiken zonder schema prefix
ALTER DATABASE postgres SET search_path TO public, extensions;

-- 6. Als je search functies gebruikt die deze extensions nodig hebben, update ze:
-- Bijvoorbeeld voor de leads search trigger
DROP TRIGGER IF EXISTS update_leads_search_fts_trigger ON leads;
DROP FUNCTION IF EXISTS update_leads_search_fts();

-- Hermaak de functie met de juiste schema references
CREATE OR REPLACE FUNCTION update_leads_search_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_fts := to_tsvector('dutch', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.email, '') || ' ' || 
        COALESCE(NEW.company, '') || ' ' || 
        COALESCE(NEW.city, '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Hermaak de trigger
CREATE TRIGGER update_leads_search_fts_trigger
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW 
    EXECUTE FUNCTION update_leads_search_fts();

-- Verificatie: check of de extensions nu in het juiste schema staan
SELECT 
    extname as extension_name,
    nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('pg_trgm', 'unaccent');