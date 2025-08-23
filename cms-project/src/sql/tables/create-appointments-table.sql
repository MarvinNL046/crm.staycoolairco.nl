-- Create appointments table for internal calendar
CREATE TABLE IF NOT EXISTS appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_by UUID NOT NULL,
  
  -- Basic appointment info
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Time info
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  
  -- Relations (foreign keys will be added later if tables exist)
  lead_id UUID,
  contact_id UUID,
  customer_id UUID,
  
  -- Appointment type and status
  type TEXT CHECK (type IN ('meeting', 'call', 'visit', 'installation', 'service', 'other')) DEFAULT 'meeting',
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')) DEFAULT 'scheduled',
  
  -- Colors for calendar display
  color TEXT DEFAULT '#3B82F6', -- Default blue
  
  -- Reminders
  reminder_minutes INTEGER[], -- Array of reminder times in minutes before appointment
  
  -- Notes and outcomes
  notes TEXT,
  outcome TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT appointments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT appointments_end_after_start CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS appointments_tenant_id_idx ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_created_by_idx ON appointments(created_by);
CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS appointments_contact_id_idx ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS appointments_customer_id_idx ON appointments(customer_id);

-- Create trigger for updated_at
CREATE TRIGGER trg_set_updated_at_appointments 
BEFORE UPDATE ON appointments 
FOR EACH ROW 
EXECUTE FUNCTION set_updated_at();

-- Add RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy for viewing appointments (users can see appointments in their tenant)
CREATE POLICY "Users can view their tenant appointments" ON appointments
  FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

-- Policy for creating appointments
CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Policy for updating appointments (only creator can update)
CREATE POLICY "Users can update their own appointments" ON appointments
  FOR UPDATE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Policy for deleting appointments (only creator can delete)
CREATE POLICY "Users can delete their own appointments" ON appointments
  FOR DELETE
  USING (
    tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Add comment
COMMENT ON TABLE appointments IS 'Internal calendar appointments for CRM users';