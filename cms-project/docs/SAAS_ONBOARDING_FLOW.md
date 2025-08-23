# SaaS Onboarding Flow Documentation

## Overview
Complete onboarding flow voor nieuwe SaaS klanten met:
- Multi-step wizard
- Automatische tenant setup
- Default data creatie
- Post-onboarding checklist

## Components

### 1. Onboarding API (`/api/auth/onboarding`)
- Maakt nieuwe tenant aan
- Configureert alle default data:
  - BTW percentages (0%, 9%, 21%)
  - Industry-specific tags
  - Pipeline stages
  - Email templates
  - Automation rules
- Koppelt user aan tenant als owner

### 2. Onboarding Page (`/app/onboarding`)
3-step wizard:
1. **Company Info**: Bedrijfsnaam en branche
2. **Subdomain**: Kies unieke URL (bijv. klant.staycoolcrm.nl)
3. **Confirmation**: Overzicht en account creatie

### 3. Middleware Protection
- Checkt of user een tenant_id heeft
- Redirect naar onboarding als niet
- Checkt trial expiration
- Checkt tenant status (active/inactive)

### 4. Post-Onboarding Checklist
Interactive checklist component die nieuwe users helpt:
- Eerste lead toevoegen
- Contact aanmaken
- Eerste factuur maken
- Email templates configureren
- Bedrijfsgegevens invullen

## Database Changes Needed

Voor de onboarding flow moet je eerst deze fixes toepassen:

```sql
-- 1. Fix profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 2. Ensure all tables exist
Run: /scripts/01-create-only-missing-tables.sql
```

## Usage

### Voor nieuwe gebruikers:
1. User registreert zich via `/auth/register`
2. Wordt automatisch doorgestuurd naar `/onboarding`
3. Vult bedrijfsinfo en subdomain in
4. Account wordt aangemaakt met alle defaults
5. Redirect naar dashboard met onboarding checklist

### Voor bestaande gebruikers zonder tenant:
1. Bij elke page load checkt middleware tenant_id
2. Indien geen tenant_id → redirect naar `/onboarding`

### Trial Management:
- 14 dagen gratis trial
- Na expiratie → redirect naar `/dashboard/billing`
- Verschillende plans: trial, starter, professional, enterprise

## Plans & Limits

```typescript
const planLimits = {
  trial: { max_users: 2, max_leads: 100, days: 14 },
  starter: { max_users: 5, max_leads: 1000 },
  professional: { max_users: 20, max_leads: 10000 },
  enterprise: { max_users: 999, max_leads: 999999 }
}
```

## Next Steps

1. Implementeer billing page voor plan upgrades
2. Voeg subdomain routing toe (tenant1.staycoolcrm.nl)
3. Implementeer tenant switching voor users met multiple tenants
4. Add tenant-specific branding options
5. Implementeer usage tracking en limits

## Security Notes

- Alle API calls checken tenant_id via RLS
- Users kunnen alleen eigen tenant data zien
- Subdomain moet uniek zijn
- Email verificatie recommended voor nieuwe accounts