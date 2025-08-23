# RLS Performance Optimization Guide

## Overview

This document explains the Row Level Security (RLS) performance optimizations applied to fix the warnings identified by Supabase's database linter.

## Issues Identified

### 1. Auth RLS Initialization Plan (auth_rls_initplan)

**Problem**: RLS policies were calling `auth.uid()` directly in the policy conditions, causing it to be re-evaluated for each row. This creates significant performance overhead at scale.

**Example of problematic policy**:
```sql
CREATE POLICY "Users can view their tenant's customers" ON customers
FOR SELECT USING (tenant_id IN (
  SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
));
```

### 2. Multiple Permissive Policies

**Problem**: Some tables had multiple permissive policies for the same role and action, requiring each policy to be evaluated separately.

**Example**:
- `invoice_items` table had both "Users can view invoice items" and "Users can manage invoice items" policies
- `products` table had similar duplicate policies

## Solutions Implemented

### 1. Subquery Optimization

**Solution**: Wrap `auth.uid()` calls in a subquery `(SELECT auth.uid())` to ensure it's only evaluated once per query.

**Optimized policy example**:
```sql
CREATE POLICY "customer_select" ON public.customers FOR SELECT
    USING (tenant_id = (SELECT public.get_user_tenant_id()));
```

### 2. Helper Function

**Solution**: Created an efficient `public.get_user_tenant_id()` function that caches the tenant lookup:

```sql
CREATE OR REPLACE FUNCTION public.get_user_tenant_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() 
    LIMIT 1
$$;
```

Benefits:
- Marked as `STABLE` for query optimization
- Uses `SECURITY DEFINER` to run with function owner's privileges
- Returns the first matching tenant (most users have only one)

### 3. Policy Consolidation

**Solution**: Combined multiple permissive policies into single `FOR ALL` policies where appropriate:

```sql
-- Instead of separate SELECT, INSERT, UPDATE, DELETE policies
CREATE POLICY "product_all" ON public.products FOR ALL
    USING (tenant_id = (SELECT auth.tenant_id()));
```

### 4. Performance Indexes

**Solution**: Added indexes to improve lookup performance:

```sql
CREATE INDEX idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
```

## Performance Impact

These optimizations provide:

1. **Reduced Query Overhead**: Auth functions are called once per query instead of once per row
2. **Faster Policy Evaluation**: Consolidated policies reduce the number of checks
3. **Improved Index Usage**: Dedicated indexes speed up tenant lookups
4. **Better Query Planning**: The `STABLE` function allows PostgreSQL to optimize better

## Running the Migration

### Option 1: Using the Script
```bash
node scripts/fix-rls-performance.js
```

### Option 2: Manual Execution
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `migrations/fix-rls-performance-issues.sql`
4. Execute the migration

## Verification

After applying the migration:

1. **Re-run the linter** to confirm warnings are resolved:
   - The `auth_rls_initplan` warnings should be gone
   - The `multiple_permissive_policies` warnings should be resolved

2. **Test functionality** to ensure all operations still work:
   - User can only see their own tenant's data
   - CRUD operations work as expected
   - No unauthorized data access

3. **Monitor performance** to see improvements:
   - Check query execution times
   - Monitor database CPU usage
   - Look for reduced query complexity in logs

## Rollback Plan

If issues arise, the original policies can be restored from the production database backup or by reversing the migration.

## Best Practices for Future RLS Policies

1. **Always use subqueries** for auth functions: `(SELECT auth.uid())`
2. **Create helper functions** for complex auth logic
3. **Consolidate policies** when possible using `FOR ALL`
4. **Add appropriate indexes** for columns used in RLS policies
5. **Test performance** with realistic data volumes

## Additional Resources

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)