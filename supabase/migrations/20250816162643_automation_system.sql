-- Automation Rules Table
CREATE TABLE automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Executions Table (voor logging/debugging)
CREATE TABLE automation_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL,
  execution_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed
  result_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Triggers Types Enum (optional for documentation)
DO $$ BEGIN
  CREATE TYPE automation_trigger_type AS ENUM (
    'lead_created',
    'lead_updated', 
    'status_changed',
    'lead_assigned',
    'follow_up_due'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Automation Action Types Enum (optional for documentation)  
DO $$ BEGIN
  CREATE TYPE automation_action_type AS ENUM (
    'send_email',
    'send_sms', 
    'send_whatsapp',
    'create_task',
    'update_status',
    'add_note'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Indexes for performance
CREATE INDEX idx_automation_rules_tenant_trigger ON automation_rules(tenant_id, trigger_type) WHERE enabled = true;
CREATE INDEX idx_automation_executions_lead ON automation_executions(lead_id, executed_at);
CREATE INDEX idx_automation_executions_tenant ON automation_executions(tenant_id, executed_at);

-- RLS Policies for multi-tenant security
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access automation rules for their tenant
CREATE POLICY automation_rules_tenant_access ON automation_rules
  FOR ALL
  USING (tenant_id IN (
    SELECT tu.tenant_id 
    FROM tenant_users tu 
    WHERE tu.user_id = auth.uid()
  ));

-- Policy: Users can only access automation executions for their tenant  
CREATE POLICY automation_executions_tenant_access ON automation_executions
  FOR ALL
  USING (tenant_id IN (
    SELECT tu.tenant_id 
    FROM tenant_users tu 
    WHERE tu.user_id = auth.uid()
  ));

-- Update trigger for automation_rules
CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_rules_updated_at();

-- Function to create default automation rules for new tenants
CREATE OR REPLACE FUNCTION create_default_automation_rules(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Welcome Email for new leads with email
  INSERT INTO automation_rules (tenant_id, name, description, trigger_type, conditions, actions, enabled)
  VALUES (
    tenant_uuid,
    'Welkom Email bij Nieuwe Lead',
    'Verstuur automatisch een welkom email naar nieuwe leads met email adres',
    'lead_created',
    '[{"field": "email", "operator": "is_not_empty"}]'::jsonb,
    '[{"id": "welcome_email", "type": "send_email", "config": {"channel": "email", "template": "welcome", "delay_minutes": 0}}]'::jsonb,
    true
  );

  -- Welcome SMS for new leads with phone (no email)
  INSERT INTO automation_rules (tenant_id, name, description, trigger_type, conditions, actions, enabled)
  VALUES (
    tenant_uuid,
    'SMS bij Nieuwe Lead met Telefoon',
    'Verstuur automatisch een SMS naar nieuwe leads met telefoonnummer',
    'lead_created',
    '[{"field": "phone", "operator": "is_not_empty"}, {"field": "email", "operator": "is_empty"}]'::jsonb,
    '[{"id": "welcome_sms", "type": "send_sms", "config": {"channel": "sms", "template": "welcome", "delay_minutes": 0}}]'::jsonb,
    true
  );

  -- Status change notification for qualified leads
  INSERT INTO automation_rules (tenant_id, name, description, trigger_type, conditions, actions, enabled)
  VALUES (
    tenant_uuid,
    'Status Change Notificatie',
    'Verstuur bericht bij status wijziging naar qualified of hoger',
    'status_changed',
    '[{"field": "new_status", "operator": "equals", "value": "qualified"}]'::jsonb,
    '[{"id": "status_notification", "type": "send_email", "config": {"channel": "email", "template": "status_change", "delay_minutes": 5}}]'::jsonb,
    true
  );

  -- WhatsApp congratulations for won leads
  INSERT INTO automation_rules (tenant_id, name, description, trigger_type, conditions, actions, enabled) 
  VALUES (
    tenant_uuid,
    'WhatsApp bij Gewonnen Lead',
    'Verstuur felicitatie WhatsApp bij gewonnen lead',
    'status_changed', 
    '[{"field": "new_status", "operator": "equals", "value": "won"}, {"field": "phone", "operator": "is_not_empty"}]'::jsonb,
    '[{"id": "congratulations_whatsapp", "type": "send_whatsapp", "config": {"channel": "whatsapp", "template": "congratulations", "delay_minutes": 0}}]'::jsonb,
    true
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE automation_rules IS 'Automation rules configuration for each tenant';
COMMENT ON TABLE automation_executions IS 'Log of automation rule executions for debugging and analytics';
COMMENT ON FUNCTION create_default_automation_rules IS 'Creates default automation rules for new tenants';