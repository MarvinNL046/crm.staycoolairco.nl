-- Fix the last remaining constraint on analytics_events table
BEGIN;

-- Fix analytics_events constraint
ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;
ALTER TABLE public.analytics_events 
ADD CONSTRAINT analytics_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;

-- Final verification - should show all constraints are fixed
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Will delete with user'
        WHEN rc.delete_rule = 'SET NULL' THEN '✅ Will clear reference'
        ELSE '❌ NEEDS FIX'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name IN ('actor_id', 'id', 'assigned_to', 'created_by', 'user_id')
    AND rc.delete_rule NOT IN ('CASCADE', 'SET NULL')
ORDER BY tc.table_name;