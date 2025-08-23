# SaaS Multi-Tenant Setup voor StayCool CRM

## Wat je moet doen voor een veilige SaaS applicatie:

### Stap 1: Fix de profiles tabel structuur
Run: `/scripts/00-fix-profiles-complete.sql`

Dit voegt toe:
- `tenant_id` - CRUCIAAL voor multi-tenant isolatie
- Andere benodigde velden

### Stap 2: Maak ontbrekende tabellen
Run: `/scripts/01-create-only-missing-tables.sql`

### Stap 3: Voeg configuratie data toe
Run: `/scripts/02-insert-config-data.sql`

### Stap 4: Activeer Row Level Security (BELANGRIJK!)
Run: `/scripts/03-apply-rls-policies-fixed.sql`

Dit zorgt ervoor dat:
- Elke tenant alleen zijn eigen data kan zien
- Geen data lekken tussen tenants
- Veilige multi-tenant isolatie

## Voor nieuwe tenants (klanten):

Wanneer een nieuwe klant zich aanmeldt, moet je:

1. Een nieuwe tenant aanmaken:
```sql
INSERT INTO tenants (name, domain, settings) 
VALUES ('Nieuwe Klant B.V.', 'nieuweklant.nl', '{}');
```

2. De user koppelen aan die tenant:
```sql
UPDATE profiles 
SET tenant_id = '[nieuwe-tenant-id]' 
WHERE id = '[user-id]';
```

3. Standaard data voor die tenant aanmaken:
- BTW percentages
- Tags
- Email templates
- Pipeline stages

## Belangrijk voor SaaS:

- **RLS is cruciaal**: Zonder goede RLS kunnen klanten elkaars data zien!
- **Elke tabel met tenant_id**: Moet RLS policies hebben
- **Test grondig**: Test met verschillende tenant accounts
- **Monitoring**: Monitor of RLS goed werkt in productie

## Next steps na deze setup:

1. Maak een onboarding flow voor nieuwe tenants
2. Automatiseer het aanmaken van standaard data
3. Test met meerdere tenant accounts
4. Voeg tenant-specifieke features toe (custom branding, etc.)

Succes met je SaaS product! 🚀