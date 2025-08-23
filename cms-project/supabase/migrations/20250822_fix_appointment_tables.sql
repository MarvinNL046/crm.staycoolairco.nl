-- Fix missing appointment-related tables
-- This migration adds appointment_reminders and recurring_appointments if they don't exist

-- Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recurring_appointments table
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  recurrence_pattern VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_reminder_time ON appointment_reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_sent ON appointment_reminders(sent);

CREATE INDEX IF NOT EXISTS idx_recurring_appointments_tenant_id ON recurring_appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_parent_appointment_id ON recurring_appointments(parent_appointment_id);

-- Add RLS policies for these tables
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_appointments ENABLE ROW LEVEL SECURITY;

-- Appointment reminders policies (access based on appointment)
CREATE POLICY "Users can view appointment reminders" ON appointment_reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_reminders.appointment_id 
            AND appointments.tenant_id = auth.tenant_id()
        )
    );

CREATE POLICY "Users can manage appointment reminders" ON appointment_reminders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM appointments 
            WHERE appointments.id = appointment_reminders.appointment_id 
            AND appointments.tenant_id = auth.tenant_id()
        )
    );

-- Recurring appointments policies
CREATE POLICY "Users can view their tenant's recurring appointments" ON recurring_appointments
    FOR SELECT USING (tenant_id = auth.tenant_id());
    
CREATE POLICY "Users can manage their tenant's recurring appointments" ON recurring_appointments
    FOR ALL USING (tenant_id = auth.tenant_id());

-- Summary
DO $$
BEGIN
    RAISE NOTICE 'Appointment reminder tables have been created/verified';
    RAISE NOTICE 'RLS policies have been applied';
END $$;