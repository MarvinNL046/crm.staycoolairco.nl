-- Check which tables actually exist in the database
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('btw_percentages', 'tags', 'email_templates', 'automation_logs', 'workflow_steps', 'appointment_reminders', 'recurring_appointments') 
        THEN '❌ MISSING - NEEDS CREATION'
        ELSE '✅ EXISTS'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY 
    CASE 
        WHEN table_name IN ('btw_percentages', 'tags', 'email_templates', 'automation_logs', 'workflow_steps', 'appointment_reminders', 'recurring_appointments') 
        THEN 0 
        ELSE 1 
    END,
    table_name;