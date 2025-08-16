-- Insert default pipeline stages
INSERT INTO pipeline_stages (key, sort_order) VALUES
  ('new', 1),
  ('contacted', 2),
  ('qualified', 3),
  ('proposal', 4),
  ('won', 5),
  ('lost', 6)
ON CONFLICT DO NOTHING;

-- Verify the stages
SELECT * FROM pipeline_stages ORDER BY sort_order;