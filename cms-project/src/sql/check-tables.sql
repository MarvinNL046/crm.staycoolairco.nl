-- Check welke tabellen al bestaan
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check of campaigns tabel bestaat
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'campaigns'
);

-- Als campaigns tabel bestaat, check de kolommen
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaigns'
ORDER BY ordinal_position;