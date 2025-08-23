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
-- Based on the pattern, we'll keep the one with the more descriptive name

BEGIN;

-- Fix any remaining duplicates on api_keys if they exist
DO $$
DECLARE
    idx_rec RECORD;
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
        -- Drop all but the first (preferred) index
        FOREACH idx_name IN ARRAY idx_rec.drop_indexes
        LOOP
            EXECUTE format('DROP INDEX IF EXISTS public.%I', idx_name);
            RAISE NOTICE 'Dropped duplicate index % on table %', idx_name, idx_rec.tablename;
        END LOOP;
        RAISE NOTICE 'Kept index % on table %', idx_rec.keep_index, idx_rec.tablename;
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
  'Remaining duplicates' as check_type,
  COUNT(DISTINCT tablename || '_' || column_list) as duplicate_sets
FROM (
  SELECT tablename, column_list
  FROM index_info
  GROUP BY tablename, column_list
  HAVING COUNT(*) > 1
) t;

-- Show final index count per table
SELECT 
  tablename,
  COUNT(*) as index_count,
  STRING_AGG(indexname, ', ' ORDER BY indexname) as indexes
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, tablename;