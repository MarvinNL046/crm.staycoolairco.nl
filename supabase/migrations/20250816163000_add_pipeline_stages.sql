-- Create pipeline_stages table
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

-- Add comment for documentation
COMMENT ON TABLE pipeline_stages IS 'Pipeline stages configuration for lead management';