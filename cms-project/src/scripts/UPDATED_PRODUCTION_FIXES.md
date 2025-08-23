# Updated Production Database Fixes

## Good News! 
Most tables already exist! Only 2 tables are missing:
- ❌ `companies` - Needed for contact relationships
- ❌ `webhook_logs` - Needed for webhook tracking

## Steps to Fix:

### 1. Create the 2 Missing Tables
Run: `/scripts/01-create-only-missing-tables.sql`

### 2. Check Configuration Data
Run: `/scripts/check-config-data.sql`

If the counts are 0, then run:
### 3. Add Configuration Data (if needed)
Run: `/scripts/02-insert-config-data.sql`

### 4. Apply RLS Policies
Run: `/scripts/03-apply-rls-policies.sql`

## Summary
- Only 2 tables need to be created (companies, webhook_logs)
- Configuration data might already exist (check first)
- RLS policies still need to be applied

All scripts are in: `/home/marvin/Documenten/crm.staycoolairco.nl/cms-project/scripts/`