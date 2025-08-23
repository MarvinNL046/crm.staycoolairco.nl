# Fix RLS Performance Warnings

Deze handleiding helpt je om de RLS (Row Level Security) performance warnings in Supabase op te lossen.

## Overzicht van de warnings

### 1. Auth RLS Initialization Plan (42 warnings)
Deze warnings ontstaan omdat `auth.uid()` en andere auth functies voor elke rij opnieuw worden geëvalueerd in RLS policies. Dit is zeer inefficiënt bij grote datasets.

**Probleem**: 
```sql
-- Inefficiënt: auth.uid() wordt voor elke rij aangeroepen
created_by = auth.uid()
```

**Oplossing**:
```sql
-- Efficiënt: auth.uid() wordt maar één keer aangeroepen
created_by = (select auth.uid())
```

### 2. Multiple Permissive Policies (20 warnings)
Meerdere permissive policies voor dezelfde actie zorgen ervoor dat PostgreSQL alle policies moet evalueren, wat inefficiënt is.

**Probleem**:
- Policy 1: "Admins can manage all expenses"
- Policy 2: "Users can view their tenant's expenses"

**Oplossing**: Combineer policies met OR logic of gebruik USING conditions efficiënter.

### 3. Duplicate Indexes (2 warnings)
Duplicate indexes nemen onnodige ruimte in en vertragen write operations.

## Stap-voor-stap oplossing

### Stap 1: Backup maken
Maak eerst een backup van je huidige policies:
```sql
-- Exporteer huidige policies
SELECT 
    tablename,
    policyname,
    pg_get_expr(polqual, polrelid) as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Stap 2: Fix Auth RLS warnings

#### Optie A: Automatische fix (alle tabellen)
Run `migrations/fix-rls-performance-warnings.sql` in je Supabase SQL Editor.

#### Optie B: Handmatige fix per tabel
Voor elke tabel met warnings:

1. Identificeer de policy:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'jouw_tabel_naam';
```

2. Drop de oude policy:
```sql
DROP POLICY "policy_naam" ON public.jouw_tabel_naam;
```

3. Maak nieuwe policy met optimalisatie:
```sql
CREATE POLICY "policy_naam" ON public.jouw_tabel_naam
FOR ALL 
TO public
USING (created_by = (select auth.uid()));  -- Let op de (select ...)
```

### Stap 3: Fix Duplicate Indexes
```sql
-- Drop duplicate indexes
DROP INDEX IF EXISTS public.idx_api_keys_tenant;
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow;
```

### Stap 4: Verifieer de fixes
```sql
-- Check of auth.uid() nu gewrapt is in subqueries
SELECT 
    tablename,
    policyname,
    CASE 
        WHEN pg_get_expr(polqual, polrelid) LIKE '%(select auth.uid())%' THEN '✅ Fixed'
        WHEN pg_get_expr(polqual, polrelid) LIKE '%auth.uid()%' THEN '❌ Needs fixing'
        ELSE '✅ OK'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Impact van deze optimalisaties

### Performance verbetering
- **Voor**: Bij een query op 10.000 rijen wordt `auth.uid()` 10.000 keer aangeroepen
- **Na**: `auth.uid()` wordt maar 1 keer aangeroepen, ongeacht het aantal rijen

### Geschatte performance winst
- Kleine tabellen (<1000 rijen): 10-20% sneller
- Medium tabellen (1000-10000 rijen): 30-50% sneller
- Grote tabellen (>10000 rijen): 50-80% sneller

## Best practices voor nieuwe policies

Bij het maken van nieuwe RLS policies:

1. **Altijd subqueries gebruiken voor auth functies**:
   ```sql
   -- Goed
   user_id = (select auth.uid())
   
   -- Fout
   user_id = auth.uid()
   ```

2. **Combineer gerelateerde policies**:
   ```sql
   -- In plaats van 2 policies, gebruik 1 met OR
   CREATE POLICY "combined_access" ON table_name
   USING (
     (role = 'admin') OR 
     (user_id = (select auth.uid()) AND status = 'active')
   );
   ```

3. **Gebruik indexes op kolommen in policies**:
   ```sql
   CREATE INDEX idx_table_user_id ON table_name(user_id);
   CREATE INDEX idx_table_tenant_id ON table_name(tenant_id);
   ```

## Troubleshooting

### Als policies niet werken na de fix:
1. Check of de policy syntax correct is
2. Verifieer dat de juiste roles toegang hebben
3. Test met een specifieke user via Supabase Dashboard

### Als performance niet verbetert:
1. Check `EXPLAIN ANALYZE` voor je queries
2. Zorg dat je indexes hebt op kolommen gebruikt in policies
3. Overweeg om complexe policies te vereenvoudigen

## Monitoring

Na het toepassen van de fixes:
1. Monitor query performance via Supabase Dashboard → Database → Query Performance
2. Check de Linter regelmatig voor nieuwe warnings
3. Test kritieke queries met `EXPLAIN ANALYZE`