# Appointment Reminders Setup

## Overzicht

Het appointment reminder systeem stuurt automatisch herinneringen voor afspraken:
- **15 minuten** voor de afspraak
- **1 uur** voor de afspraak  
- **1 dag** voor de afspraak (optioneel)

## Netlify Setup

### 1. Netlify Function is al aangemaakt!

De scheduled function staat in:
```
/netlify/functions/appointment-reminders-cron.ts
```

Deze draait **elke 15 minuten** automatisch.

### 2. Environment Variables

Voeg toe in Netlify Dashboard → Site Settings → Environment variables:

```env
# Deze MOET je hebben (zelfde als voor workflows):
WORKFLOW_SECRET_KEY=your-secret-key

# Voor emails (als nog niet ingesteld):
RESEND_API_KEY=your-resend-api-key

# Optioneel voor monitoring:
WEBHOOK_ALERT_URL=https://your-webhook-for-errors
```

### 3. Database View

Er moet een database view `appointments_pending_reminders` bestaan. Check in Supabase:

```sql
-- Deze view zou al moeten bestaan, maar zo niet:
CREATE OR REPLACE VIEW appointments_pending_reminders AS
SELECT 
  a.*,
  COALESCE(c.email, co.email, l.email) as recipient_email,
  COALESCE(c.name, co.name, l.name) as recipient_name,
  ARRAY[60, 1440] as reminder_minutes -- 1 uur, 1 dag
FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
LEFT JOIN contacts co ON a.contact_id = co.id
LEFT JOIN leads l ON a.lead_id = l.id
WHERE a.start_time > NOW()
  AND a.status = 'scheduled'
  AND (a.reminder_sent IS NULL OR a.reminder_sent = false);
```

## Hoe werkt het?

1. **Cron draait elke 15 minuten**
2. **Check appointments** die binnen reminder window vallen
3. **Stuurt email** via Resend
4. **Update appointment** om duplicaten te voorkomen

## Testen

### 1. Test manual via API:
```bash
curl -X GET https://jouw-site.netlify.app/api/appointments/reminders \
  -H "Authorization: Bearer your-workflow-secret-key"
```

### 2. Test specifieke appointment:
```bash
curl -X POST https://jouw-site.netlify.app/api/appointments/reminders/test \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "appointment-uuid-here",
    "email": "test@example.com"
  }'
```

### 3. Check Netlify Functions logs:
- Ga naar Netlify Dashboard
- Functions → appointment-reminders-cron
- View logs

## Email Template

De reminder emails bevatten:
- Afspraak titel
- Datum en tijd
- Locatie (indien ingevuld)
- Beschrijving
- Tijd tot afspraak ("over 1 uur")

## Monitoring

Check regelmatig:
- Netlify Functions logs
- Resend dashboard voor delivery status
- `appointments` table voor `reminder_sent` status

## Troubleshooting

**Reminders worden niet verstuurd:**
1. Check of cron function draait in Netlify
2. Verifieer `WORKFLOW_SECRET_KEY` is ingesteld
3. Check Resend API key
4. Kijk in Supabase of view bestaat
5. Check appointment status (moet 'scheduled' zijn)

**Emails komen niet aan:**
1. Check Resend dashboard
2. Verifieer email adressen
3. Check spam folder
4. Test met test endpoint eerst