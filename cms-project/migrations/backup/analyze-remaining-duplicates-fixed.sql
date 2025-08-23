-- Analyze remaining duplicate indexes to understand what they are

-- Detailed view of remaining duplicates
WITH index_info AS (
  SELECT 
    i.schemaname,
    i.tablename,
    i.indexname,
    i.indexdef,
    SUBSTRING(i.indexdef FROM '\((.*?)\)') as column_list,
    CASE 
      WHEN c.conname IS NOT NULL THEN 
        CASE c.contype 
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE CONSTRAINT'
          WHEN 'f' THEN 'FOREIGN KEY'
          ELSE 'CONSTRAINT'
        END
      WHEN i.indexdef LIKE '%UNIQUE%' THEN 'UNIQUE INDEX'
      WHEN i.indexname LIKE '%_pkey' THEN 'PRIMARY KEY'
      ELSE 'REGULAR INDEX'
    END as index_type,
    c.conname as constraint_name
  FROM pg_indexes i
  LEFT JOIN pg_constraint c ON c.conname = i.indexname
  WHERE i.schemaname = 'public'
)
SELECT 
  tablename,
  column_list,
  COUNT(*) as index_count,
  STRING_AGG(
    indexname || ' (' || index_type || ')', 
    E'\n  ' ORDER BY index_type, indexname
  ) as indexes
FROM index_info
GROUP BY tablename, column_list
HAVING COUNT(*) > 1
ORDER BY tablename, column_list;

-- Show specifically which non-constraint duplicates exist
WITH index_info AS (
  SELECT 
    i.tablename,
    i.indexname,
    SUBSTRING(i.indexdef FROM '\((.*?)\)') as column_list,
    i.indexdef,
    CASE 
      WHEN c.conname IS NOT NULL THEN true
      WHEN i.indexdef LIKE '%UNIQUE%' THEN true
      WHEN i.indexname LIKE '%_pkey' THEN true
      ELSE false
    END as is_system_index
  FROM pg_indexes i
  LEFT JOIN pg_constraint c ON c.conname = i.indexname
  WHERE i.schemaname = 'public'
),
duplicate_groups AS (
  SELECT 
    tablename,
    column_list,
    ARRAY_AGG(indexname ORDER BY is_system_index DESC, indexname) as all_indexes,
    ARRAY_AGG(indexname ORDER BY indexname) FILTER (WHERE NOT is_system_index) as regular_indexes,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE NOT is_system_index) as regular_count
  FROM index_info
  GROUP BY tablename, column_list
  HAVING COUNT(*) > 1
)
SELECT 
  tablename,
  column_list,
  total_count,
  regular_count,
  CASE 
    WHEN regular_count > 1 THEN '⚠️ Has duplicate regular indexes'
    WHEN regular_count = 1 AND total_count > 1 THEN '✅ Regular + System indexes (OK)'
    ELSE '✅ Only system indexes (OK)'
  END as status,
  all_indexes
FROM duplicate_groups
ORDER BY 
  CASE 
    WHEN regular_count > 1 THEN 0
    ELSE 1
  END,
  tablename;

-- Summary of what needs fixing
WITH index_info AS (
  SELECT 
    i.tablename,
    i.indexname,
    SUBSTRING(i.indexdef FROM '\((.*?)\)') as column_list,
    CASE 
      WHEN c.conname IS NOT NULL THEN true
      WHEN i.indexdef LIKE '%UNIQUE%' THEN true
      WHEN i.indexname LIKE '%_pkey' THEN true
      ELSE false
    END as is_system_index
  FROM pg_indexes i
  LEFT JOIN pg_constraint c ON c.conname = i.indexname
  WHERE i.schemaname = 'public'
),
duplicate_summary AS (
  SELECT 
    tablename,
    column_list,
    COUNT(*) FILTER (WHERE NOT is_system_index) as regular_count,
    COUNT(*) as total_count
  FROM index_info
  GROUP BY tablename, column_list
  HAVING COUNT(*) > 1
)
SELECT 
  'Summary' as report,
  COUNT(*) FILTER (WHERE regular_count > 1) as tables_need_fixing,
  COUNT(*) FILTER (WHERE regular_count <= 1) as tables_ok_system_duplicates,
  COUNT(*) as total_duplicate_sets
FROM duplicate_summary;