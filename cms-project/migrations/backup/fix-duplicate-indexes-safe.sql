-- Safe fix for duplicate indexes (skips constraint indexes)
-- First, let's see which duplicate indexes exist (excluding constraints)

-- Check which indexes are duplicates, excluding constraint-based indexes
WITH index_info AS (
  SELECT 
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    SUBSTRING(i.indexdef FROM '\((.*?)\)') as column_list,
    -- Check if index is part of a constraint
    CASE 
      WHEN c.conname IS NOT NULL THEN true
      ELSE false
    END as is_constraint
  FROM pg_indexes i
  LEFT JOIN pg_constraint c ON c.conname = i.indexname
  WHERE i.schemaname = 'public'
)
SELECT 
  tablename,
  column_list,
  STRING_AGG(
    indexname || CASE WHEN is_constraint THEN ' (CONSTRAINT)' ELSE '' END, 
    ', ' ORDER BY indexname
  ) as indexes,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE NOT is_constraint) as non_constraint_count
FROM index_info
GROUP BY tablename, column_list
HAVING COUNT(*) > 1
ORDER BY tablename;

-- Now fix only non-constraint duplicate indexes
BEGIN;

-- Specifically handle the known duplicates from the warnings
DROP INDEX IF EXISTS public.idx_api_keys_tenant;  -- Keep idx_api_keys_tenant_id
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow;  -- Keep idx_workflow_executions_workflow_id

-- Handle any other non-constraint duplicates
DO $$
DECLARE
    dup_rec RECORD;
    idx_to_drop TEXT;
    drop_count INTEGER := 0;
BEGIN
    FOR dup_rec IN
        WITH index_info AS (
          SELECT 
            i.tablename,
            i.indexname,
            SUBSTRING(i.indexdef FROM '\((.*?)\)') as column_list,
            -- Check if index is part of a constraint
            CASE 
              WHEN c.conname IS NOT NULL THEN true
              ELSE false
            END as is_constraint
          FROM pg_indexes i
          LEFT JOIN pg_constraint c ON c.conname = i.indexname
          WHERE i.schemaname = 'public'
        ),
        duplicate_groups AS (
          SELECT 
            tablename,
            column_list,
            ARRAY_AGG(
              indexname ORDER BY 
              -- Constraints always win
              is_constraint DESC,
              -- Prefer indexes with table name in them
              CASE WHEN indexname LIKE '%' || tablename || '%' THEN 0 ELSE 1 END,
              -- Prefer longer names
              LENGTH(indexname) DESC,
              indexname
            ) FILTER (WHERE NOT is_constraint) as droppable_indexes,
            COUNT(*) FILTER (WHERE NOT is_constraint) as droppable_count
          FROM index_info
          GROUP BY tablename, column_list
          HAVING COUNT(*) > 1
        )
        SELECT 
            tablename,
            column_list,
            droppable_indexes,
            droppable_count
        FROM duplicate_groups
        WHERE droppable_count > 0
    LOOP
        -- If we have more than one non-constraint index on the same columns, drop extras
        IF dup_rec.droppable_count > 0 AND array_length(dup_rec.droppable_indexes, 1) > 1 THEN
            -- Keep the first one, drop the rest
            FOR i IN 2..array_length(dup_rec.droppable_indexes, 1) LOOP
                idx_to_drop := dup_rec.droppable_indexes[i];
                
                -- Double-check it's not a constraint
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = idx_to_drop
                ) THEN
                    EXECUTE format('DROP INDEX IF EXISTS public.%I', idx_to_drop);
                    RAISE NOTICE 'Dropped duplicate index % on table %', idx_to_drop, dup_rec.tablename;
                    drop_count := drop_count + 1;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total duplicate indexes dropped: %', drop_count;
END $$;

COMMIT;

-- Final verification - show remaining duplicate column sets
WITH index_info AS (
  SELECT 
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    SUBSTRING(i.indexdef FROM '\((.*?)\)') as column_list,
    CASE 
      WHEN c.conname IS NOT NULL THEN 'CONSTRAINT'
      ELSE 'INDEX'
    END as index_type
  FROM pg_indexes i
  LEFT JOIN pg_constraint c ON c.conname = i.indexname
  WHERE i.schemaname = 'public'
)
SELECT 
  tablename,
  column_list,
  COUNT(*) as index_count,
  STRING_AGG(indexname || ' (' || index_type || ')', ', ' ORDER BY index_type, indexname) as indexes
FROM index_info
GROUP BY tablename, column_list
HAVING COUNT(*) > 1
ORDER BY tablename, column_list;

-- Summary
SELECT 
  'Summary' as report,
  COUNT(*) as tables_with_duplicate_column_sets
FROM (
  SELECT tablename, SUBSTRING(indexdef FROM '\((.*?)\)') as column_list
  FROM pg_indexes
  WHERE schemaname = 'public'
  GROUP BY tablename, column_list
  HAVING COUNT(*) > 1
) t;