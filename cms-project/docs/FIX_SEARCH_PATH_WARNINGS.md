# Fix Function Search Path Security Warnings

Deze handleiding helpt je om de "Function Search Path Mutable" waarschuwingen in Supabase op te lossen.

## Probleem

De functies `get_user_tenant_id` en `update_leads_search_fts` hebben geen expliciete `search_path` ingesteld. Dit kan een security risico zijn omdat kwaadwillende gebruikers mogelijk de search_path kunnen manipuleren.

## Oplossing

### Optie 1: Via Supabase Dashboard SQL Editor (Aanbevolen)

1. **Log in op je Supabase Dashboard**
2. **Ga naar SQL Editor**
3. **Kopieer en plak de inhoud van één van deze bestanden:**
   - `migrations/fix-function-search-paths-safe.sql` (Veilige versie met checks)
   - `migrations/fix-function-search-paths.sql` (Directe versie)

4. **Klik op "Run"**

### Optie 2: Via Supabase CLI

```bash
# Vanuit de project directory
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < migrations/fix-function-search-paths-safe.sql
```

### Optie 3: Via Direct SQL

```sql
-- Voor get_user_tenant_id
ALTER FUNCTION public.get_user_tenant_id(uuid) SET search_path = public;

-- Voor update_leads_search_fts
ALTER FUNCTION public.update_leads_search_fts() SET search_path = public;
```

## Verificatie

Na het uitvoeren van de migration, kun je controleren of de warnings zijn opgelost:

1. Ga naar Supabase Dashboard → Database → Linter
2. De warnings voor deze functies zouden nu verdwenen moeten zijn

## Waarom is dit belangrijk?

- **Security**: Voorkomt search_path injection attacks
- **Best Practice**: Expliciete search_path is een PostgreSQL security best practice
- **Compliance**: Voldoet aan Supabase security aanbevelingen

## Troubleshooting

Als de warnings blijven bestaan:

1. Check of de functies daadwerkelijk zijn geüpdatet:
```sql
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('get_user_tenant_id', 'update_leads_search_fts');
```

2. Force een re-scan in de Supabase Linter door te wachten of de pagina te refreshen

3. Als de functies niet bestaan, check eerst welke functies je hebt:
```sql
SELECT n.nspname, p.proname 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
```