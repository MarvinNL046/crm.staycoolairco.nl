# Extension Security Warnings Fix

## Het probleem
Je hebt 2 PostgreSQL extensions in het `public` schema:
- `pg_trgm` - Voor text search functionaliteit
- `unaccent` - Voor het verwijderen van accenten in text

Supabase waarschuwt dat deze beter in een apart schema kunnen staan voor security.

## Oplossingen

### Optie 1: Verplaats Extensions (Aanbevolen)
Run: `/scripts/fix-extensions-security.sql`

Dit script:
1. Maakt een `extensions` schema aan
2. Verplaatst beide extensions erheen
3. Update de search_path
4. Herstelt alle functies die de extensions gebruiken

⚠️ **LET OP**: Dit gebruikt `DROP CASCADE` wat tijdelijk functies kan breken. Test eerst in development!

### Optie 2: Veiligere Alternatief
Run: `/scripts/fix-extensions-alternative.sql`

Als optie 1 problemen geeft, probeer dit script dat:
- Probeert `ALTER EXTENSION` (werkt mogelijk niet in Supabase)
- Beperkt toegang tot extension functies
- Geeft suggesties voor support ticket

### Optie 3: Accepteer de Warning (Tijdelijk)
Als je applicatie goed werkt en je RLS goed hebt geconfigureerd:
- De warning is niet kritiek
- Extensions in public schema is niet ideaal maar ook niet onveilig
- Je kunt later met Supabase support dit oplossen

## Waarom is dit belangrijk?

**Security**: Extensions in public schema kunnen mogelijk misbruikt worden
**Best Practice**: Scheiding van concerns - extensions in eigen schema
**Toekomst**: Voorkomt problemen bij Supabase updates

## Test na de fix

```sql
-- Check of extensions verplaatst zijn
SELECT 
    extname as extension,
    nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('pg_trgm', 'unaccent');

-- Test of search nog werkt
SELECT * FROM leads 
WHERE search_fts @@ plainto_tsquery('dutch', 'test');
```

## Als het mis gaat

1. Restore je database backup
2. Of contacteer Supabase support voor hulp
3. De warnings zijn niet kritiek - je app blijft werken