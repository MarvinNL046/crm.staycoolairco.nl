# SaaS Quick Fix Guide

## Het probleem:
Je database mist essentiële kolommen voor multi-tenant SaaS:
- `tenants` tabel mist: domain, settings
- `profiles` tabel mist: tenant_id (cruciaal!)

## De oplossing - Run deze scripts IN VOLGORDE:

### 1. Check eerst de structuur van je tabellen:
```sql
Run: /scripts/check-tenants-structure.sql
Run: /scripts/check-profiles-structure.sql  
```

### 2. Fix alle tabellen voor SaaS:
```sql
Run: /scripts/00-fix-all-tables-for-saas.sql
```
Dit voegt alle missende kolommen toe.

### 3. Maak ontbrekende tabellen aan:
```sql
Run: /scripts/01-create-only-missing-tables.sql
```

### 4. Voeg configuratie data toe:
```sql
Run: /scripts/02-insert-config-data.sql
```

### 5. Activeer Row Level Security:
```sql
Run: /scripts/03-apply-rls-policies-fixed.sql
```

## Daarna kun je nieuwe tenants aanmaken:

Voor elke nieuwe klant:
```sql
-- 1. Maak tenant aan
INSERT INTO tenants (name, domain, settings) 
VALUES ('Klant B.V.', 'klant.nl', '{}')
RETURNING id;

-- 2. Koppel user aan tenant
UPDATE profiles 
SET tenant_id = '[nieuwe-tenant-id]' 
WHERE id = '[user-id]';

-- 3. Of gebruik het complete script:
Run: /scripts/create-new-tenant.sql (pas eerst de variabelen aan!)
```

## Waarom is dit belangrijk?

Zonder deze fixes:
- ❌ Geen multi-tenant isolatie
- ❌ Klanten kunnen elkaars data zien
- ❌ Geen SaaS mogelijk

Met deze fixes:
- ✅ Volledige data isolatie per klant
- ✅ Veilige multi-tenant SaaS
- ✅ Schaalbaar voor nieuwe klanten