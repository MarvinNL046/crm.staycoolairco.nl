-- Alternatieve aanpak als DROP CASCADE problemen geeft
-- Deze methode is veiliger maar vereist mogelijk een Supabase support ticket

-- Optie 1: Gebruik ALTER EXTENSION (als Supabase dit toestaat)
-- Let op: Dit werkt mogelijk niet in Supabase vanwege permissies

-- Maak eerst het extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Probeer de extensions te verplaatsen zonder DROP
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Als bovenstaande niet werkt, dan:

-- Optie 2: Behoud in public maar met betere security
-- Dit is een tijdelijke oplossing tot Supabase support het kan fixen

-- Beperk toegang tot de extension functies
REVOKE ALL ON FUNCTION pg_trgm_in(cstring) FROM PUBLIC;
REVOKE ALL ON FUNCTION pg_trgm_out(pg_trgm) FROM PUBLIC;
-- Voeg meer functies toe zoals nodig

-- Geef alleen specifieke rollen toegang
GRANT EXECUTE ON FUNCTION pg_trgm_in(cstring) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_trgm_out(pg_trgm) TO authenticated;

-- Optie 3: Contact Supabase Support
-- Als je deze extensions echt moet verplaatsen en bovenstaande niet werkt,
-- open een support ticket bij Supabase. Zij kunnen dit op database niveau fixen.

-- Voor nu kun je de warning negeren als de applicatie goed werkt.
-- De extensions in public schema is niet ideaal maar ook niet kritiek voor security
-- zolang je RLS goed hebt geconfigureerd.