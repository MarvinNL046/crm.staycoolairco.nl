# Automation Setup Instructions

## Database Schema Setup

To enable automation triggers, you need to apply the database schema to your Supabase project.

### Step 1: Apply Database Schema

Go to your Supabase project dashboard → SQL Editor and run the SQL from `AUTOMATION_TABLES.sql`:

```sql
-- Run the contents of AUTOMATION_TABLES.sql
-- This creates the automation_rules and automation_executions tables
-- Plus RLS policies and helper functions
```

### Step 2: Create Default Automation Rules

After the schema is applied, you can create default automation rules from the Settings page:

1. Go to Dashboard → Settings
2. Scroll to "Automation Regels" section
3. Click "Standaard Regels Aanmaken"

This will create default automation rules including:
- Welcome email for new leads with email
- Welcome SMS for new leads with phone (no email)  
- Status change notifications
- WhatsApp congratulations for won leads

### Step 3: Test Automation

#### Test via Webhook:
```bash
curl -X POST "http://localhost:3000/api/webhook?tenant_id=YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "phone": "+31612345678",
    "message": "Test automation"
  }'
```

#### Test via CSV Import:
1. Go to Dashboard → Leads
2. Click "CSV Import"
3. Upload a CSV with test leads
4. Check that automation triggers are fired

#### Test Status Changes:
1. Open a lead in the pipeline
2. Drag to a different status
3. Check that status change automations are triggered

### Step 4: Monitor Automation

Check automation execution in:
- Browser console (automation logs)
- Supabase logs (API calls)
- Email/SMS delivery confirmations

### Automation Features

✅ **Implemented:**
- Lead created triggers
- Status changed triggers  
- Email automation via Resend
- SMS automation via MessageBird
- WhatsApp automation via MessageBird
- Condition evaluation
- Settings page management

🔄 **Triggered by:**
- Webhook lead creation
- API lead creation  
- CSV import
- Pipeline status changes
- Manual lead updates

📊 **Automation Types:**
- `send_email` - Resend email service
- `send_sms` - MessageBird SMS
- `send_whatsapp` - MessageBird WhatsApp
- `create_task` - Create follow-up tasks (logged)
- `update_status` - Change lead status
- `add_note` - Add notes to lead activities

### Troubleshooting

**Automation not triggering:**
- Check automation rules are enabled in Settings
- Verify conditions are met
- Check browser console for errors
- Verify API keys are configured

**Messages not sending:**
- Verify Resend API key for emails
- Verify MessageBird API keys for SMS/WhatsApp  
- Check lead has required contact info (email/phone)
- Check network logs for API failures

**Database errors:**
- Ensure AUTOMATION_TABLES.sql was applied
- Check RLS policies allow access
- Verify tenant_id is correct

### Performance Notes

- Automation triggers are fired asynchronously (background)
- No await on automation calls to prevent blocking
- Failed automations log errors but don't break main flow
- Default 5-minute delay for status change notifications
- Batch processing for CSV imports

---

Automation system is now fully integrated into StayCool CRM! 🚀