-- Create pipeline_stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  color VARCHAR(50) DEFAULT 'bg-gray-500',
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_tenant_id ON pipeline_stages(tenant_id);

-- Insert default stages for all existing tenants
INSERT INTO pipeline_stages (tenant_id, name, status, color, sort_order)
SELECT 
  t.id as tenant_id,
  stage.name,
  stage.status,
  stage.color,
  stage.sort_order
FROM tenants t
CROSS JOIN (
  VALUES 
    ('Nieuw', 'new', 'bg-blue-500', 1),
    ('Gecontacteerd', 'contacted', 'bg-yellow-500', 2),
    ('Gekwalificeerd', 'qualified', 'bg-purple-500', 3),
    ('Geconverteerd', 'converted', 'bg-green-500', 4),
    ('Verloren', 'lost', 'bg-red-500', 5)
) AS stage(name, status, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_stages ps 
  WHERE ps.tenant_id = t.id 
  AND ps.status = stage.status
);

-- Enable RLS (but keep it simple for now)
ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;

-- Verify the stages were created
SELECT 
  t.name as tenant_name,
  ps.name as stage_name,
  ps.status,
  ps.color,
  ps.sort_order
FROM pipeline_stages ps
JOIN tenants t ON t.id = ps.tenant_id
ORDER BY t.name, ps.sort_order;