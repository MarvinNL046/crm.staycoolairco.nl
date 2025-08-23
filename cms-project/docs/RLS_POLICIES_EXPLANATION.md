# RLS Policies Uitleg

## Overzicht van alle tabellen en hun policies

### 1. Tenant-scoped tabellen (met tenant_id)
Deze tabellen hebben standaard multi-tenant isolatie:
- **activities** - Activiteiten log, users kunnen alleen eigen activiteiten bewerken
- **analytics_events** - Analytics data per tenant
- **automation_executions** - Automation runs per tenant
- **automation_triggers** - Automation configuratie per tenant
- **automations** - Legacy automation table
- **call_logs** - Telefoon logs per tenant
- **deals** - Deals/opportunities per tenant
- **expenses** - Uitgaven, met speciale regels voor admins
- **integrations** - Third-party koppelingen per tenant
- **invoice_sequences** - Factuurnummer reeksen per tenant
- **message_outbox** - Uitgaande berichten queue
- **message_templates** - Bericht sjablonen
- **sms_logs** - SMS geschiedenis
- **tasks** - Taken, users kunnen alleen toegewezen/eigen taken bewerken
- **team_members** - Team leden, alleen admins kunnen beheren
- **templates** - Document templates per tenant

### 2. Gerelateerde tabellen (geen eigen tenant_id)
Deze gebruiken JOINs om tenant te bepalen:
- **campaign_clicks** - Via campaigns → tenant_id
- **campaign_links** - Via campaigns → tenant_id  
- **campaign_recipients** - Via campaigns → tenant_id

### 3. Junction tabellen
Voor many-to-many relaties:
- **tenant_users** - Koppelt users aan tenants
- **user_tenants** - Reverse koppeling

### 4. Globale/Admin tabellen
Geen tenant isolatie:
- **platform_settings** - Alleen super admins
- **super_admins** - Alleen zichtbaar voor super admins
- **system_audit_log** - Super admins zien alles, users alleen eigen logs
- **workflow_actions** - Globale workflow acties (iedereen kan zien)
- **workflow_triggers** - Globale workflow triggers (iedereen kan zien)

## Security overwegingen

1. **Tenant Isolatie**: Alle business data is strikt gescheiden per tenant
2. **User Permissions**: Sommige tabellen hebben extra restricties op user niveau
3. **Admin Roles**: Admins/owners hebben meer rechten binnen hun tenant
4. **Super Admin**: Platform-wide toegang voor systeem beheer

## Belangrijke tabellen voor jouw CRM

Voor een SaaS CRM zijn deze het belangrijkst:
- leads (al geconfigureerd)
- contacts (al geconfigureerd)
- deals
- tasks
- activities
- campaigns + gerelateerde tabellen
- automations
- team_members

De rest kun je eventueel RLS disabelen als je ze niet gebruikt.