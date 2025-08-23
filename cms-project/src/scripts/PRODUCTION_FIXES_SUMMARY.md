# Production Database Fixes Summary

## Current Status
Based on the analysis, your production database has:
- ❌ 12 tables are MISSING:
  - `companies` - Needed for contact relationships
  - `btw_percentages` - Needed for invoicing
  - `tags` - Needed for lead categorization
  - `email_templates` - Needed for email automation
  - `campaign_metrics` - Needed for campaign tracking
  - `automation_logs` - Needed for automation history
  - `workflow_steps` - Needed for workflow execution
  - `workflow_executions` - Needed for workflow tracking
  - `appointment_reminders` - Needed for appointment notifications
  - `recurring_appointments` - Needed for recurring appointments
  - `api_keys` - Needed for API access
  - `webhook_logs` - Needed for webhook tracking
- ✅ Multi-tenant setup is working (tenant: Staycool Airconditioning)
- ⚠️ Missing configuration data for existing tables
- ❌ RLS (Row Level Security) is only partially active

## Required Fixes - RUN IN THIS ORDER!

### 0. (Optional) Check Missing Tables
Run `/scripts/00-check-all-tables.sql` to see which tables are missing

### 1. Create Missing Tables
Run the SQL in `/scripts/01-create-ALL-missing-tables.sql` in your Supabase SQL editor:

This will create:
- btw_percentages table
- tags table
- email_templates table
- automation_logs table
- workflow_steps table
- appointment_reminders table
- recurring_appointments table

### 2. Add Configuration Data
Run the SQL in `/scripts/02-insert-config-data.sql` in your Supabase SQL editor:

This will add:
- 3 BTW percentages (0%, 9%, 21%)
- 8 default tags for lead categorization
- 4 email templates for automation

### 3. Apply RLS Policies
Run the SQL in `/scripts/03-apply-rls-policies.sql` in your Supabase SQL editor:

This will:
- Enable RLS on all tables
- Create proper tenant isolation policies
- Ensure users can only see their own tenant's data

## How to Apply

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. **IMPORTANT: Run these scripts IN ORDER**:
   - First: `/scripts/01-create-missing-tables.sql`
   - Then: `/scripts/02-insert-config-data.sql`
   - Finally: `/scripts/03-apply-rls-policies.sql`
4. Execute each script one by one

## Alternative: Using Node.js Scripts

If the Supabase schema cache gets refreshed, you can also run:
```bash
node scripts/add-config-data.js
```

## Files Created
- `/scripts/insert-config-data.sql` - Adds missing configuration data
- `/scripts/apply-rls-policies.sql` - Applies RLS policies
- `/scripts/PRODUCTION_FIXES_SUMMARY.md` - This summary file

## Verification
After applying the fixes, run:
```bash
node scripts/analyze-production-complete.js
```

This will confirm that all fixes have been applied successfully.