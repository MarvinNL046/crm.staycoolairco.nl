-- VOER DIT UIT IN JE SUPABASE SQL EDITOR!
-- Ga naar: https://supabase.com/dashboard/project/bdrbfgqgktiuvmynksbe/sql/new

-- Create pipeline_stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL
);

-- Insert default pipeline stages
INSERT INTO pipeline_stages (key, sort_order) VALUES
  ('new', 1),
  ('contacted', 2),
  ('qualified', 3),
  ('proposal', 4),
  ('won', 5),
  ('lost', 6)
ON CONFLICT (key) DO NOTHING;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_sort_order ON pipeline_stages(sort_order);

-- Check if it worked
SELECT * FROM pipeline_stages ORDER BY sort_order;