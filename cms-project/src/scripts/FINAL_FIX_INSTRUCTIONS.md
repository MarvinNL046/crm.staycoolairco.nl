# Final Fix Instructions

## Run these scripts IN ORDER:

### 1. Check profiles table structure
Run: `/scripts/check-profiles-structure.sql`
- This shows the columns in the profiles table

### 2. Fix profiles table (if tenant_id is missing)
Run: `/scripts/00-fix-profiles-table.sql`
- This adds the tenant_id column to profiles if it's missing
- Sets the tenant_id for existing profiles

### 3. Create missing tables (companies and webhook_logs)
Run: `/scripts/01-create-only-missing-tables.sql`

### 4. Check if configuration data exists
Run: `/scripts/check-config-data.sql`

### 5. Add configuration data (if counts are 0)
Run: `/scripts/02-insert-config-data.sql`

### 6. Apply RLS policies
Run: `/scripts/03-apply-rls-policies-fixed.sql`

## Summary
1. The profiles table was missing the tenant_id column
2. Only 2 tables need to be created (companies, webhook_logs)
3. Configuration data needs to be added
4. RLS policies need to be applied

All scripts are in: `/home/marvin/Documenten/crm.staycoolairco.nl/cms-project/scripts/`