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
      WHEN c.conname IS NOT NULL THEN c.contype || ' CONSTRAINT'
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

-- Check if we have actual duplicates that need fixing
SELECT 
  COUNT(*) FILTER (WHERE regular_count > 1) as fixable_duplicates,
  COUNT(*) FILTER (WHERE regular_count <= 1) as system_duplicates_ok
FROM (
  SELECT 
    tablename,
    SUBSTRING(indexdef FROM '\((.*?)\)') as column_list,
    COUNT(*) FILTER (WHERE NOT (
      conname IS NOT NULL OR 
      indexdef LIKE '%UNIQUE%' OR 
      indexname LIKE '%_pkey'
    )) as regular_count
  FROM pg_indexes i
  LEFT JOIN pg_constraint c ON c.conname = i.indexname
  WHERE i.schemaname = 'public'
  GROUP BY tablename, column_list
  HAVING COUNT(*) > 1
) t;