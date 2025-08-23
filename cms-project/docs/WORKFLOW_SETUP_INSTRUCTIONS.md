# Workflow Automation Setup Instructies

## Wat moet je instellen voor productie?

### 1. Environment Variables (.env.local)

```env
# Database (heb je waarschijnlijk al)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # ⚠️ BELANGRIJK: Nodig voor server-side

# Email (als je Resend gebruikt)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@staycoolairco.nl

# SMS (als je MessageBird gebruikt)
MESSAGEBIRD_API_KEY=your-messagebird-key
MESSAGEBIRD_ORIGINATOR=StayCool

# Security
WORKFLOW_SECRET_KEY=genereer-een-random-string-hier
WEBHOOK_SECRET=nog-een-random-string-voor-webhooks

# Voor Vercel (als je Vercel gebruikt)
CRON_SECRET=random-string-voor-vercel-cron
```

### 2. Database Migrations

Run de nieuwe migration voor workflow tables:

```bash
# In je project directory
npx supabase migration up
```

Of voer handmatig uit in Supabase SQL editor:
- `/supabase/migrations/20250817_workflow_execution_tables.sql`

### 3. Deployment Platform Setup

#### Voor Netlify:
1. **Cron job wordt automatisch gedetecteerd** uit `/netlify/functions/workflow-cron.ts`
2. Zorg dat je Netlify Functions enabled hebt
3. De cron draait elke 5 minuten automatisch

#### Voor Vercel:
1. Maak `/api/cron/workflow.ts` aan (code staat in documentatie)
2. Voeg toe aan `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/workflow",
    "schedule": "*/5 * * * *"
  }]
}
```

### 4. Test de Setup

1. **Test database triggers:**
   ```sql
   -- Check of triggers bestaan
   SELECT trigger_name FROM information_schema.triggers 
   WHERE trigger_schema = 'public';
   ```

2. **Test manual workflow execution:**
   ```bash
   curl -X PUT https://jouw-site.nl/api/workflows/execute \
     -H "Content-Type: application/json" \
     -d '{"workflowId": "test-id", "triggerData": {"test": true}}'
   ```

3. **Test webhook endpoint:**
   ```bash
   curl -X GET https://jouw-site.nl/api/webhooks/workflow?key=test
   ```

### 5. Monitoring

Check regelmatig deze tables in Supabase:
- `workflow_trigger_queue` - Moet leeg blijven (items worden verwerkt)
- `workflow_executions` - Historie van uitgevoerde workflows
- `workflow_scheduled_jobs` - Geplande acties (wait steps)

### 6. Belangrijke Notes

⚠️ **BELANGRIJK**: 
- De UI werkt al, maar workflows worden PAS uitgevoerd als de cron job draait
- Zonder proper setup blijven triggers in de queue staan
- Test eerst in development voordat je live gaat

### 7. Quick Checklist

- [ ] Environment variables ingesteld
- [ ] Database migrations uitgevoerd
- [ ] Service key geconfigureerd
- [ ] Email service (Resend/SMTP) werkt
- [ ] Cron job geactiveerd op hosting
- [ ] Test workflow uitgevoerd
- [ ] Monitoring opgezet

## Troubleshooting

**Workflows worden niet uitgevoerd:**
1. Check `workflow_trigger_queue` - staan er items in?
2. Check logs van je cron function
3. Verifieer dat `WORKFLOW_SECRET_KEY` correct is

**Email wordt niet verstuurd:**
1. Check Resend API key
2. Verifieer FROM email adres
3. Check workflow execution logs in database

**Cron draait niet:**
1. Netlify: Check Functions tab in dashboard
2. Vercel: Check Functions logs
3. Test manual execution eerst

## Support

Voor hulp kun je:
1. De logs checken in je hosting dashboard
2. De documentatie op `/crm/docs` raadplegen
3. Contact opnemen via `/crm/help`