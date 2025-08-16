-- Minimal Super Admin Implementation
-- Works with existing schema

-- Create super_admins table 
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Platform settings table for super admin
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System audit log
CREATE TABLE IF NOT EXISTS system_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id),
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'tenant', 'user', 'system'
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some SaaS columns to existing tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_leads INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_actor ON system_audit_log(actor_id, created_at);

-- RLS Policies
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can access their own record and others if they are super admin
CREATE POLICY super_admins_access ON super_admins
  FOR ALL
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- Platform settings - super admins only
CREATE POLICY platform_settings_super_admin ON platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- System audit log - super admins only
CREATE POLICY system_audit_log_super_admin ON system_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
    )
  );

-- Update existing policies to give super admin access
DROP POLICY IF EXISTS tenants_access ON tenants;
CREATE POLICY tenants_access ON tenants
  FOR ALL
  USING (
    -- Super admin can access all tenants
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
    )
    OR
    -- Regular tenant access
    (id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu 
      WHERE tu.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS leads_tenant_access ON leads;
CREATE POLICY leads_tenant_access ON leads
  FOR ALL
  USING (
    -- Super admin can access all leads
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = auth.uid()
    )
    OR
    -- Regular tenant access
    (tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu 
      WHERE tu.user_id = auth.uid()
    ))
  );

-- Function to create super admin user
CREATE OR REPLACE FUNCTION create_super_admin_user(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Add to super admins table
  INSERT INTO super_admins (user_id, email, created_by)
  VALUES (target_user_id, user_email, COALESCE(auth.uid(), target_user_id))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Log the action
  INSERT INTO system_audit_log (actor_id, actor_email, action, target_type, target_id, details)
  VALUES (
    COALESCE(auth.uid(), target_user_id),
    user_email,
    'create_super_admin',
    'user',
    target_user_id,
    jsonb_build_object('email', user_email, 'created_by', COALESCE(auth.uid(), target_user_id))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins sa
    WHERE sa.user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('app_name', '"StayCool CRM"', 'Application name'),
('app_version', '"1.0.0"', 'Current application version'),
('maintenance_mode', 'false', 'Enable maintenance mode'),
('registration_enabled', 'true', 'Allow new tenant registration'),
('trial_days', '14', 'Default trial period in days'),
('max_trial_leads', '100', 'Maximum leads during trial'),
('support_email', '"support@staycoolairco.nl"', 'Support contact email')
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE super_admins IS 'Platform super administrators';
COMMENT ON TABLE platform_settings IS 'Global platform configuration settings';
COMMENT ON TABLE system_audit_log IS 'System-wide audit trail for super admin actions';