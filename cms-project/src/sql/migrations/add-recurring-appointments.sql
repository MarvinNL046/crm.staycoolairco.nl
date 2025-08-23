-- Add recurring appointment support to the appointments table
-- Author: StayCool CRM
-- Date: 2024-12-20

-- Add columns for recurring appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER CHECK (recurrence_day_of_month >= 1 AND recurrence_day_of_month <= 31),
ADD COLUMN IF NOT EXISTS recurrence_month_of_year INTEGER CHECK (recurrence_month_of_year >= 1 AND recurrence_month_of_year <= 12),
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_count INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_id UUID,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_exception_dates DATE[],
ADD COLUMN IF NOT EXISTS edit_scope TEXT CHECK (edit_scope IN ('this', 'this_and_future', 'all')),
ADD COLUMN IF NOT EXISTS original_start_time TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS appointments_recurrence_id_idx ON appointments(recurrence_id);
CREATE INDEX IF NOT EXISTS appointments_is_recurring_idx ON appointments(is_recurring);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments(start_time);

-- Add columns for email reminders
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_emails TEXT[]; -- array of email addresses to send reminders to

-- Create a view for upcoming appointments that need reminders
CREATE OR REPLACE VIEW appointments_pending_reminders AS
SELECT 
  a.*,
  CASE 
    WHEN a.customer_id IS NOT NULL THEN c.email
    WHEN a.contact_id IS NOT NULL THEN ct.email
    WHEN a.lead_id IS NOT NULL THEN l.email
    ELSE NULL
  END as recipient_email,
  CASE 
    WHEN a.customer_id IS NOT NULL THEN c.name
    WHEN a.contact_id IS NOT NULL THEN ct.name
    WHEN a.lead_id IS NOT NULL THEN l.name
    ELSE NULL
  END as recipient_name
FROM appointments a
LEFT JOIN customers c ON a.customer_id = c.id
LEFT JOIN contacts ct ON a.contact_id = ct.id
LEFT JOIN leads l ON a.lead_id = l.id
WHERE 
  a.status = 'scheduled'
  AND a.reminder_sent = FALSE
  AND a.reminder_minutes IS NOT NULL
  AND ARRAY_LENGTH(a.reminder_minutes, 1) > 0
  AND a.start_time > NOW();

-- Function to generate recurring appointments
CREATE OR REPLACE FUNCTION generate_recurring_appointments(
  p_recurrence_id UUID,
  p_base_appointment JSONB,
  p_max_occurrences INTEGER DEFAULT 365
) RETURNS TABLE (
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_pattern TEXT;
  v_interval INTEGER;
  v_days_of_week INTEGER[];
  v_day_of_month INTEGER;
  v_month_of_year INTEGER;
  v_end_date DATE;
  v_count INTEGER;
  v_current_start TIMESTAMP WITH TIME ZONE;
  v_current_end TIMESTAMP WITH TIME ZONE;
  v_duration INTERVAL;
  v_occurrence_count INTEGER := 0;
BEGIN
  -- Extract recurrence parameters
  v_pattern := p_base_appointment->>'recurrence_pattern';
  v_interval := COALESCE((p_base_appointment->>'recurrence_interval')::INTEGER, 1);
  v_days_of_week := ARRAY(SELECT jsonb_array_elements_text(p_base_appointment->'recurrence_days_of_week'))::INTEGER[];
  v_day_of_month := (p_base_appointment->>'recurrence_day_of_month')::INTEGER;
  v_month_of_year := (p_base_appointment->>'recurrence_month_of_year')::INTEGER;
  v_end_date := (p_base_appointment->>'recurrence_end_date')::DATE;
  v_count := (p_base_appointment->>'recurrence_count')::INTEGER;
  
  -- Calculate duration
  v_current_start := (p_base_appointment->>'start_time')::TIMESTAMP WITH TIME ZONE;
  v_current_end := (p_base_appointment->>'end_time')::TIMESTAMP WITH TIME ZONE;
  v_duration := v_current_end - v_current_start;
  
  -- Generate occurrences based on pattern
  WHILE v_occurrence_count < COALESCE(v_count, p_max_occurrences) LOOP
    -- Check end date
    IF v_end_date IS NOT NULL AND v_current_start::DATE > v_end_date THEN
      EXIT;
    END IF;
    
    -- Return the occurrence
    RETURN QUERY SELECT v_current_start, v_current_start + v_duration;
    v_occurrence_count := v_occurrence_count + 1;
    
    -- Calculate next occurrence based on pattern
    CASE v_pattern
      WHEN 'daily' THEN
        v_current_start := v_current_start + (v_interval || ' days')::INTERVAL;
      WHEN 'weekly' THEN
        v_current_start := v_current_start + (v_interval || ' weeks')::INTERVAL;
      WHEN 'monthly' THEN
        v_current_start := v_current_start + (v_interval || ' months')::INTERVAL;
      WHEN 'yearly' THEN
        v_current_start := v_current_start + (v_interval || ' years')::INTERVAL;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION generate_recurring_appointments IS 'Generates recurring appointment occurrences based on recurrence pattern';