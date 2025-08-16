-- Super Admin and Enhanced Multi-Tenant Schema
-- Add user roles and platform management

-- User roles enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',    -- Platform owner
    'tenant_admin',   -- Tenant owner/admin
    'tenant_user',    -- Regular tenant user
    'tenant_viewer'   -- Read-only access
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tenant status enum
DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM (
    'active',
    'suspended',
    'trial',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add super admin flag to users table
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Add role to tenant_users table
ALTER TABLE tenant_users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'tenant_user';

-- Add enhanced tenant information
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS status tenant_status DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_leads INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '14 days',
ADD COLUMN IF NOT EXISTS whitelabel_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS billing_settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS usage_stats JSONB DEFAULT '{}'::jsonb;

-- Platform settings table for super admin
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant usage tracking
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_created INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  whatsapp_sent INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

-- Billing and subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '{}'::jsonb,
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- White-label customization
CREATE TABLE IF NOT EXISTS tenant_branding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  custom_domain VARCHAR(255),
  email_signature TEXT,
  custom_css TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  custom_login_page BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_date ON tenant_usage(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_actor ON system_audit_log(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_target ON system_audit_log(target_type, target_id);

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can access everything
CREATE POLICY platform_settings_super_admin ON platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.is_super_admin = true
    )
  );

-- Tenant usage - super admins and tenant admins can view
CREATE POLICY tenant_usage_access ON tenant_usage
  FOR ALL
  USING (
    -- Super admin access
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.is_super_admin = true
    )
    OR
    -- Tenant admin access to their own data
    (tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu 
      WHERE tu.user_id = auth.uid() 
      AND tu.role IN ('tenant_admin')
    ))
  );

-- Tenant subscriptions - similar access pattern
CREATE POLICY tenant_subscriptions_access ON tenant_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.is_super_admin = true
    )
    OR
    (tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu 
      WHERE tu.user_id = auth.uid() 
      AND tu.role IN ('tenant_admin')
    ))
  );

-- Tenant branding - tenants can manage their own branding
CREATE POLICY tenant_branding_access ON tenant_branding
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.is_super_admin = true
    )
    OR
    (tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu 
      WHERE tu.user_id = auth.uid() 
      AND tu.role IN ('tenant_admin', 'tenant_user')
    ))
  );

-- System audit log - super admins only
CREATE POLICY system_audit_log_super_admin ON system_audit_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.is_super_admin = true
    )
  );

-- Update existing tenant_users policy to include role-based access
DROP POLICY IF EXISTS tenant_users_access ON tenant_users;
CREATE POLICY tenant_users_access ON tenant_users
  FOR ALL
  USING (
    -- Super admin can access all
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.is_super_admin = true
    )
    OR
    -- Users can access their own tenant
    (tenant_id IN (
      SELECT tu.tenant_id 
      FROM tenant_users tu 
      WHERE tu.user_id = auth.uid()
    ))
  );

-- Function to create super admin user
CREATE OR REPLACE FUNCTION create_super_admin_user(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Update user to be super admin
  UPDATE auth.users 
  SET is_super_admin = true 
  WHERE email = user_email;
  
  -- Log the action
  INSERT INTO system_audit_log (actor_email, action, target_type, details)
  VALUES (
    user_email,
    'create_super_admin',
    'user',
    jsonb_build_object('email', user_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create tenant with initial admin
CREATE OR REPLACE FUNCTION create_tenant_with_admin(
  tenant_name TEXT,
  admin_user_id UUID,
  plan_name TEXT DEFAULT 'trial'
)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Create tenant
  INSERT INTO tenants (name, subscription_plan)
  VALUES (tenant_name, plan_name)
  RETURNING id INTO new_tenant_id;
  
  -- Add user as tenant admin
  INSERT INTO tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, admin_user_id, 'tenant_admin');
  
  -- Create default branding
  INSERT INTO tenant_branding (tenant_id)
  VALUES (new_tenant_id);
  
  -- Create initial subscription record
  INSERT INTO tenant_subscriptions (
    tenant_id, 
    plan_name, 
    starts_at,
    ends_at
  )
  VALUES (
    new_tenant_id,
    plan_name,
    NOW(),
    CASE 
      WHEN plan_name = 'trial' THEN NOW() + INTERVAL '14 days'
      ELSE NULL
    END
  );
  
  -- Initialize usage tracking
  INSERT INTO tenant_usage (tenant_id, date)
  VALUES (new_tenant_id, CURRENT_DATE);
  
  RETURN new_tenant_id;
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
('support_email', '"support@staycoolairco.nl"', 'Support contact email'),
('pricing_plans', '{"trial": {"price": 0, "leads": 100, "users": 2}, "starter": {"price": 29, "leads": 1000, "users": 5}, "professional": {"price": 79, "leads": 5000, "users": 15}, "enterprise": {"price": 199, "leads": 25000, "users": 50}}', 'Available pricing plans')
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE platform_settings IS 'Global platform configuration settings';
COMMENT ON TABLE tenant_usage IS 'Daily usage tracking per tenant';
COMMENT ON TABLE tenant_subscriptions IS 'Tenant subscription and billing information';
COMMENT ON TABLE tenant_branding IS 'White-label customization per tenant';
COMMENT ON TABLE system_audit_log IS 'System-wide audit trail for super admin actions';