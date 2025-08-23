-- Add retry_count column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN leads.retry_count IS 'Number of times a lead has been retried from "geen gehoor" status. Max 3 attempts before auto-moving to lost.';

-- Update any existing leads in 'qualified' (geen gehoor) status to have retry_count
UPDATE leads 
SET retry_count = 1 
WHERE status = 'qualified' AND retry_count = 0;