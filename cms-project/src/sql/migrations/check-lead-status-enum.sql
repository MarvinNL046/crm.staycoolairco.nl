-- Check the lead_status enum values
SELECT 
    unnest(enum_range(NULL::lead_status)) AS status_value
ORDER BY 1;

-- Or use this query to see the enum definition
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'lead_status'
ORDER BY e.enumsortorder;