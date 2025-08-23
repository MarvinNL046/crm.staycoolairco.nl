-- Fix remaining duplicate indexes
-- First, let's see which duplicate indexes still exist

-- Check which indexes are duplicates
WITH index_info AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    -- Extract the column list from index definition
    SUBSTRING(indexdef FROM '\((.*?)\)') as column_list
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT 
  tablename,
  column_list,
  STRING_AGG(indexname, ', ' ORDER BY indexname) as duplicate_indexes,
  COUNT(*) as count
FROM index_info
GROUP BY tablename, column_list
HAVING COUNT(*) > 1
ORDER BY tablename;

-- Now fix the duplicates
BEGIN;

-- Fix any remaining duplicates
DO $$
DECLARE
    idx_rec RECORD;
    idx_name TEXT;
    drop_count INTEGER := 0;
BEGIN
    -- Find all duplicate index groups
    FOR idx_rec IN 
        WITH index_info AS (
          SELECT 
            tablename,
            indexname,
            indexdef,
            SUBSTRING(indexdef FROM '\((.*?)\)') as column_list
          FROM pg_indexes
          WHERE schemaname = 'public'
        ),
        duplicates AS (
          SELECT 
            tablename,
            column_list,
            ARRAY_AGG(indexname ORDER BY 
              -- Prefer indexes with table name in them
              CASE WHEN indexname LIKE '%' || tablename || '%' THEN 0 ELSE 1 END,
              -- Prefer longer, more descriptive names
              LENGTH(indexname) DESC,
              indexname
            ) as index_names
          FROM index_info
          GROUP BY tablename, column_list
          HAVING COUNT(*) > 1
        )
        SELECT 
            tablename,
            column_list,
            index_names[1] as keep_index,
            index_names[2:] as drop_indexes
        FROM duplicates
    LOOP
        -- Keep the first index
        RAISE NOTICE 'Keeping index % on table %', idx_rec.keep_index, idx_rec.tablename;
        
        -- Drop all other indexes
        FOR i IN 1..array_length(idx_rec.drop_indexes, 1) LOOP
            idx_name := idx_rec.drop_indexes[i];
            EXECUTE format('DROP INDEX IF EXISTS public.%I', idx_name);
            RAISE NOTICE 'Dropped duplicate index % on table %', idx_name, idx_rec.tablename;
            drop_count := drop_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Total duplicate indexes dropped: %', drop_count;
END $$;

COMMIT;

-- Alternative approach if the above doesn't work - manually drop known duplicates
BEGIN;

-- Based on the original warnings, drop these specific duplicates
DROP INDEX IF EXISTS public.idx_api_keys_tenant;  -- Keep idx_api_keys_tenant_id
DROP INDEX IF EXISTS public.idx_workflow_executions_workflow;  -- Keep idx_workflow_executions_workflow_id

-- Check if there are any other common duplicate patterns
DO $$
DECLARE
    dup_rec RECORD;
BEGIN
    FOR dup_rec IN
        WITH index_info AS (
          SELECT 
            tablename,
            indexname,
            SUBSTRING(indexdef FROM '\((.*?)\)') as column_list
          FROM pg_indexes
          WHERE schemaname = 'public'
        )
        SELECT 
            tablename,
            column_list,
            ARRAY_AGG(indexname ORDER BY LENGTH(indexname) DESC) as indexes
        FROM index_info
        GROUP BY tablename, column_list
        HAVING COUNT(*) > 1
    LOOP
        -- For each set of duplicates, drop all but the first (longest name)
        FOR i IN 2..array_length(dup_rec.indexes, 1) LOOP
            EXECUTE format('DROP INDEX IF EXISTS public.%I', dup_rec.indexes[i]);
            RAISE NOTICE 'Dropped duplicate index %', dup_rec.indexes[i];
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- Verify all duplicates are removed
WITH index_info AS (
  SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    SUBSTRING(indexdef FROM '\((.*?)\)') as column_list
  FROM pg_indexes
  WHERE schemaname = 'public'
)
SELECT 
  'Final check' as status,
  COUNT(*) as remaining_duplicate_sets
FROM (
  SELECT tablename, column_list
  FROM index_info
  GROUP BY tablename, column_list
  HAVING COUNT(*) > 1
) t;

-- Show which indexes remain on tables that had duplicates
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('api_keys', 'workflow_executions')
ORDER BY tablename, indexname;