# Supabase Security Fixes

This document explains the security issues found by Supabase linter and how to fix them.

## Security Issues Overview

### 1. SECURITY DEFINER Views (3 issues)

**Problem**: Views created with `SECURITY DEFINER` run with the permissions of the view creator, not the current user. This bypasses Row Level Security (RLS) policies.

**Affected Views**:
- `v_leads_by_status`
- `v_current_user_tenants` 
- `appointments_pending_reminders`

**Solution**: Recreate views with `SECURITY INVOKER` (default) instead.

### 2. RLS Disabled on Public Tables (19 issues)

**Problem**: Tables in the public schema are exposed to the PostgREST API without Row Level Security enabled. This means any authenticated user can access all data.

**Affected Tables**:
- `automation_rules`, `automation_executions`
- `tenant_users`, `system_audit_log`
- `pipeline_stages`, `profiles`, `super_admins`
- `message_outbox`, `platform_settings`
- `leads`, `appointments`
- `campaign_recipients`, `campaign_links`, `campaign_clicks`
- `workflows`, `workflow_templates`, `workflow_executions`
- `workflow_actions`, `workflow_triggers`

**Solution**: Enable RLS and create appropriate policies for each table.

## How to Apply Fixes

### Option 1: Full Security Fix (Recommended)

Run the comprehensive security fix script:

```bash
# In Supabase SQL Editor or via psql
\i migrations/fix-security-issues.sql
```

This script:
1. Recreates views without SECURITY DEFINER
2. Enables RLS on all tables
3. Creates comprehensive RLS policies
4. Adds helper functions for tenant-based access
5. Creates performance indexes

### Option 2: Safe Security Fix (If tables might not exist)

Run the safe version that checks for existence:

```bash
# In Supabase SQL Editor or via psql
\i migrations/fix-security-issues-safe.sql
```

This script:
1. Safely checks if tables/views exist before modifying
2. Creates basic RLS policies (authenticated users only)
3. Provides verification queries

### Option 3: Manual Fixes via Supabase Dashboard

1. **Fix Views**:
   - Go to SQL Editor
   - Drop and recreate each view without `SECURITY DEFINER`

2. **Enable RLS**:
   - Go to Authentication > Policies
   - For each table, toggle "Enable RLS"
   - Create appropriate policies

## RLS Policy Examples

### Basic Authenticated Access
```sql
CREATE POLICY "Authenticated users can access" ON public.table_name
    FOR ALL TO authenticated USING (true);
```

### Tenant-Based Access
```sql
CREATE POLICY "Users can view their tenant data" ON public.table_name
    FOR SELECT USING (tenant_id = auth.user_tenant_id());
```

### User-Specific Access
```sql
CREATE POLICY "Users can manage their own data" ON public.table_name
    FOR ALL USING (user_id = auth.uid());
```

## Verification

After applying fixes, verify security is properly configured:

```sql
-- Check views (should not show SECURITY DEFINER)
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public';

-- Check RLS status (rowsecurity should be true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Best Practices

1. **Always enable RLS** on tables in the public schema
2. **Use SECURITY INVOKER** for views (default behavior)
3. **Create specific policies** rather than blanket access
4. **Test policies** with different user roles
5. **Monitor access** through audit logs

## Additional Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)