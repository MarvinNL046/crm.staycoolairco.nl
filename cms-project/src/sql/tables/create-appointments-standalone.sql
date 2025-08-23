-- Create appointments table (standalone version without foreign keys)
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
  
  -- Relations (just UUID fields, no foreign keys yet)
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
  CONSTRAINT appointments_end_after_start CHECK (end_time > start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS appointments_tenant_id_idx ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments(start_time);
CREATE INDEX IF NOT EXISTS appointments_created_by_idx ON appointments(created_by);
CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS appointments_contact_id_idx ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS appointments_customer_id_idx ON appointments(customer_id);

-- Add comment
COMMENT ON TABLE appointments IS 'Internal calendar appointments for CRM users';