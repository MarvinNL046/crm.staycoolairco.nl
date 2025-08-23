# Security Warnings Fix Guide

## Overview

This document explains the security warnings identified by Supabase's database linter and how to fix them.

## Issues Identified

### 1. Function Search Path Mutable

**Problem**: Functions without a fixed `search_path` are vulnerable to SQL injection attacks through schema shadowing. An attacker could create objects in a schema that appears earlier in the search path, potentially hijacking function behavior.

**Affected Functions**:
- `generate_recurring_appointments`
- `get_user_tenant_id`
- `set_updated_at`
- `update_updated_at_column`
- `create_super_admin_user`
- `create_tenant_for_user`
- `update_automation_rules_updated_at`
- `create_default_automation_rules`
- `create_tenant_rls_policies`
- `calculate_invoice_totals`
- `update_invoice_totals`
- `generate_invoice_number`

### 2. Extensions in Public Schema

**Problem**: PostgreSQL extensions installed in the `public` schema can create security risks and namespace pollution. Extensions should be isolated in their own schema.

**Affected Extensions**:
- `pg_trgm` - Text similarity functions
- `unaccent` - Text normalization functions

## Solutions Implemented

### 1. Setting Function Search Paths

For each function, we set an explicit search path to prevent schema shadowing attacks:

```sql
ALTER FUNCTION public.function_name() SET search_path = public, pg_catalog;
```

This ensures functions only look for objects in the specified schemas in that exact order.

**Example**:
```sql
-- Before (vulnerable)
CREATE FUNCTION get_user_tenant_id() RETURNS uuid AS $$
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql;

-- After (secure)
ALTER FUNCTION public.get_user_tenant_id() SET search_path = public, pg_catalog;
```

### 2. Moving Extensions to Dedicated Schema

Created a dedicated `extensions` schema and moved extensions there:

```sql
-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION pg_trgm WITH SCHEMA extensions;
```

## Running the Migration

### Option 1: Direct SQL Execution
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `migrations/fix-security-warnings.sql`
4. Execute the migration

### Option 2: Check for Dependencies First
Before running the migration, check if your code uses these extensions:

```sql
-- Check for pg_trgm usage
SELECT * FROM pg_indexes WHERE indexdef LIKE '%gin_trgm_ops%';

-- Check for unaccent usage in functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%unaccent%';
```

## Post-Migration Steps

### 1. Update Application Code

If your application directly calls extension functions, update the references:

**Before**:
```sql
SELECT * FROM customers WHERE unaccent(name) ILIKE unaccent($1);
```

**After**:
```sql
SELECT * FROM customers WHERE extensions.unaccent(name) ILIKE extensions.unaccent($1);
```

### 2. Update Search Path (Alternative)

Alternatively, you can add the extensions schema to your application's search path:

```sql
SET search_path TO public, extensions;
```

Or in your connection string:
```
postgresql://user:pass@host/db?options=-csearch_path%3Dpublic%2Cextensions
```

### 3. Recreate Indexes

If you have any indexes using pg_trgm, they need to be recreated:

```sql
-- Drop old index
DROP INDEX IF EXISTS idx_customers_name_trgm;

-- Create new index with extensions schema
CREATE INDEX idx_customers_name_trgm ON public.customers 
USING gin (name extensions.gin_trgm_ops);
```

## Verification

After applying the migration:

1. **Re-run the linter** to confirm warnings are resolved
2. **Test functionality** that uses:
   - Text search with pg_trgm
   - Unaccent functionality
   - All modified functions
3. **Check application** for any broken queries

## Security Benefits

1. **Function Search Path**:
   - Prevents SQL injection through schema shadowing
   - Makes function behavior predictable
   - Improves security audit compliance

2. **Extension Isolation**:
   - Reduces attack surface
   - Prevents namespace pollution
   - Better access control

## Best Practices for Future Development

1. **Always set search_path** for new functions:
   ```sql
   CREATE FUNCTION my_function() RETURNS void AS $$
   -- function body
   $$ LANGUAGE plpgsql SET search_path = public, pg_catalog;
   ```

2. **Install extensions in dedicated schemas**:
   ```sql
   CREATE EXTENSION new_extension WITH SCHEMA extensions;
   ```

3. **Use fully qualified names** when security is critical:
   ```sql
   SELECT public.customers.* FROM public.customers;
   ```

## Rollback Plan

If issues arise after migration:

1. **Restore function search paths**:
   ```sql
   ALTER FUNCTION public.function_name() RESET search_path;
   ```

2. **Move extensions back to public**:
   ```sql
   DROP EXTENSION pg_trgm;
   CREATE EXTENSION pg_trgm;
   ```

## Additional Resources

- [PostgreSQL Search Path Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL Extension Security](https://www.postgresql.org/docs/current/extend-extensions.html)