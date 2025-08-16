-- Add value field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS value DECIMAL(10,2) DEFAULT 0;

-- Add some example values to existing leads (optional)
UPDATE leads SET value = 
  CASE 
    WHEN status = 'new' THEN 500 + (RANDOM() * 1000)
    WHEN status = 'contacted' THEN 1000 + (RANDOM() * 2000)
    WHEN status = 'qualified' THEN 2000 + (RANDOM() * 3000)
    WHEN status = 'proposal' THEN 3000 + (RANDOM() * 5000)
    WHEN status = 'won' THEN 5000 + (RANDOM() * 10000)
    ELSE 0
  END
WHERE value IS NULL OR value = 0;