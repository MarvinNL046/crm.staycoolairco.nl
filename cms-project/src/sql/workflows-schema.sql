-- Workflow Automation Schema voor StayCool CRM

-- 1. Workflows tabel (de hoofdworkflow)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  
  -- Workflow basics
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general', -- lead, customer, appointment, email, etc
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, draft
  
  -- Trigger settings
  trigger_type VARCHAR(50) NOT NULL, -- lea
  d_created, lead_updated, form_submitted, etc
  trigger_conditions JSONB DEFAULT '{}', -- Extra conditions voor de trigger
  
  -- Workflow data
  nodes JSONB DEFAULT '[]', -- React Flow nodes
  edges JSONB DEFAULT '[]', -- React Flow edges/connections
  
  -- Stats
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Workflow templates (voorgedefinieerde workflows)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  icon VARCHAR(50),
  
  -- Template data
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  
  -- Metadata
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Workflow executions (log van uitgevoerde workflows)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  
  -- Trigger info
  trigger_data JSONB DEFAULT '{}', -- De data die de workflow triggerde
  trigger_source VARCHAR(100), -- lead_created, manual, api, etc
  
  -- Execution details
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, cancelled
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,
  execution_log JSONB DEFAULT '[]', -- Log van alle stappen
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Workflow actions (beschikbare acties in workflows)
CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Action info
  key VARCHAR(100) UNIQUE NOT NULL, -- send_email, create_task, wait, etc
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- communication, crm, time, logic
  icon VARCHAR(50),
  
  -- Configuration
  config_schema JSONB DEFAULT '{}', -- Schema voor de configuratie
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  required_integrations TEXT[], -- welke integraties nodig zijn
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Workflow triggers (beschikbare triggers)
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Trigger info
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  icon VARCHAR(50),
  
  -- Configuration
  config_schema JSONB DEFAULT '{}',
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Insert standaard workflow actions
INSERT INTO workflow_actions (key, name, description, category, icon, config_schema) VALUES
  ('send_email', 'Stuur Email', 'Stuur een email naar een contact', 'communication', 'Mail', 
   '{"to": {"type": "string", "required": true}, "subject": {"type": "string", "required": true}, "body": {"type": "string", "required": true}}'),
  
  ('send_sms', 'Stuur SMS', 'Stuur een SMS bericht', 'communication', 'MessageSquare',
   '{"to": {"type": "string", "required": true}, "message": {"type": "string", "required": true}}'),
  
  ('create_task', 'Maak Taak', 'Maak een nieuwe taak aan', 'crm', 'CheckSquare',
   '{"title": {"type": "string", "required": true}, "description": {"type": "string"}, "assignee": {"type": "string"}}'),
  
  ('update_lead_status', 'Update Lead Status', 'Verander de status van een lead', 'crm', 'UserCheck',
   '{"status": {"type": "select", "options": ["new", "contacted", "qualified", "proposal", "won", "lost"], "required": true}}'),
  
  ('add_tag', 'Voeg Tag Toe', 'Voeg een tag toe aan een contact', 'crm', 'Tag',
   '{"tag": {"type": "string", "required": true}}'),
  
  ('wait', 'Wacht', 'Wacht een bepaalde tijd', 'time', 'Clock',
   '{"duration": {"type": "number", "required": true}, "unit": {"type": "select", "options": ["minutes", "hours", "days"], "required": true}}'),
  
  ('condition', 'Conditie', 'Voer verschillende acties uit op basis van condities', 'logic', 'GitBranch',
   '{"conditions": {"type": "array", "required": true}}'),
  
  ('webhook', 'Webhook', 'Stuur data naar een externe URL', 'integration', 'Globe',
   '{"url": {"type": "string", "required": true}, "method": {"type": "select", "options": ["GET", "POST"], "required": true}}')
ON CONFLICT (key) DO NOTHING;

-- Insert standaard workflow triggers
INSERT INTO workflow_triggers (key, name, description, category, icon, config_schema) VALUES
  ('lead_created', 'Lead Aangemaakt', 'Trigger wanneer een nieuwe lead wordt aangemaakt', 'crm', 'UserPlus', '{}'),
  ('lead_status_changed', 'Lead Status Veranderd', 'Trigger wanneer de status van een lead verandert', 'crm', 'UserCheck', 
   '{"from_status": {"type": "select", "options": ["any", "new", "contacted", "qualified"]}, "to_status": {"type": "select", "options": ["any", "contacted", "qualified", "won", "lost"]}}'),
  ('form_submitted', 'Formulier Ingediend', 'Trigger wanneer een formulier wordt ingediend', 'forms', 'FileText', 
   '{"form_id": {"type": "string"}}'),
  ('appointment_scheduled', 'Afspraak Gepland', 'Trigger wanneer een afspraak wordt gepland', 'calendar', 'Calendar', '{}'),
  ('email_opened', 'Email Geopend', 'Trigger wanneer een email wordt geopend', 'email', 'Mail', 
   '{"campaign_id": {"type": "string"}}'),
  ('tag_added', 'Tag Toegevoegd', 'Trigger wanneer een tag wordt toegevoegd', 'crm', 'Tag',
   '{"tag": {"type": "string"}}'),
  ('manual', 'Handmatig', 'Start workflow handmatig', 'general', 'Play', '{}')
ON CONFLICT (key) DO NOTHING;

-- Insert een voorbeeld workflow template
INSERT INTO workflow_templates (name, description, category, icon, nodes, edges) VALUES
  ('Welkom nieuwe lead', 
   'Stuur automatisch een welkomst email en maak een follow-up taak', 
   'lead', 
   'UserPlus',
   '[
     {"id": "trigger", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "Lead Aangemaakt", "trigger": "lead_created"}},
     {"id": "email", "type": "action", "position": {"x": 300, "y": 100}, "data": {"label": "Stuur Welkomst Email", "action": "send_email", "config": {"subject": "Welkom bij StayCool!", "body": "Bedankt voor uw interesse..."}}},
     {"id": "wait", "type": "action", "position": {"x": 500, "y": 100}, "data": {"label": "Wacht 1 dag", "action": "wait", "config": {"duration": 1, "unit": "days"}}},
     {"id": "task", "type": "action", "position": {"x": 700, "y": 100}, "data": {"label": "Maak Follow-up Taak", "action": "create_task", "config": {"title": "Bel nieuwe lead"}}}
   ]',
   '[
     {"id": "e1", "source": "trigger", "target": "email"},
     {"id": "e2", "source": "email", "target": "wait"},
     {"id": "e3", "source": "wait", "target": "task"}
   ]'
  ),
  ('Lead nurturing flow',
   'Automatische email serie voor lead nurturing',
   'lead',
   'TrendingUp',
   '[
     {"id": "trigger", "type": "trigger", "position": {"x": 100, "y": 200}, "data": {"label": "Lead Status = Qualified", "trigger": "lead_status_changed"}},
     {"id": "email1", "type": "action", "position": {"x": 300, "y": 200}, "data": {"label": "Stuur Info Email", "action": "send_email"}},
     {"id": "wait1", "type": "action", "position": {"x": 500, "y": 200}, "data": {"label": "Wacht 3 dagen", "action": "wait", "config": {"duration": 3, "unit": "days"}}},
     {"id": "condition", "type": "condition", "position": {"x": 700, "y": 200}, "data": {"label": "Email geopend?", "action": "condition"}},
     {"id": "email2", "type": "action", "position": {"x": 900, "y": 100}, "data": {"label": "Stuur Follow-up", "action": "send_email"}},
     {"id": "task", "type": "action", "position": {"x": 900, "y": 300}, "data": {"label": "Bel Lead", "action": "create_task"}}
   ]',
   '[
     {"id": "e1", "source": "trigger", "target": "email1"},
     {"id": "e2", "source": "email1", "target": "wait1"},
     {"id": "e3", "source": "wait1", "target": "condition"},
     {"id": "e4", "source": "condition", "target": "email2", "label": "Ja"},
     {"id": "e5", "source": "condition", "target": "task", "label": "Nee"}
   ]'
  );

-- Succes bericht
SELECT 'Workflow tables aangemaakt!' as status;