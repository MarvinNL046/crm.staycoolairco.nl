-- Drop table if exists (for clean start)
DROP TABLE IF EXISTS appointments CASCADE;

-- Create appointments table (simple version)
CREATE TABLE appointments (
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
  
  -- Relations (just UUID fields)
  lead_id UUID,
  contact_id UUID,
  customer_id UUID,
  
  -- Appointment type and status
  type TEXT DEFAULT 'meeting',
  status TEXT DEFAULT 'scheduled',
  
  -- Colors for calendar display
  color TEXT DEFAULT '#3B82F6',
  
  -- Reminders
  reminder_minutes INTEGER[],
  
  -- Notes and outcomes
  notes TEXT,
  outcome TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Primary key
  PRIMARY KEY (id)
);

-- Add check constraints separately
ALTER TABLE appointments ADD CONSTRAINT appointments_type_check 
  CHECK (type IN ('meeting', 'call', 'visit', 'installation', 'service', 'other'));

ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show'));

ALTER TABLE appointments ADD CONSTRAINT appointments_end_after_start 
  CHECK (end_time > start_time);

-- Create indexes one by one
CREATE INDEX appointments_tenant_id_idx ON appointments(tenant_id);
CREATE INDEX appointments_start_time_idx ON appointments(start_time);
CREATE INDEX appointments_created_by_idx ON appointments(created_by);