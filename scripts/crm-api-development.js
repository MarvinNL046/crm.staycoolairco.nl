// CRM API Development Workflow for Claude Flow
// This script orchestrates the development of all CRM API endpoints

const crmModules = {
  customers: {
    endpoints: ['GET /api/customers', 'POST /api/customers', 'PUT /api/customers/:id', 'DELETE /api/customers/:id'],
    features: ['search', 'filtering', 'pagination', 'sorting']
  },
  contacts: {
    endpoints: ['GET /api/contacts', 'POST /api/contacts', 'PUT /api/contacts/:id', 'DELETE /api/contacts/:id'],
    features: ['customer-linking', 'search', 'tags']
  },
  deals: {
    endpoints: ['GET /api/deals', 'POST /api/deals', 'PUT /api/deals/:id', 'DELETE /api/deals/:id', 'PUT /api/deals/:id/stage'],
    features: ['pipeline-management', 'stage-tracking', 'value-calculation']
  },
  campaigns: {
    endpoints: ['GET /api/campaigns', 'POST /api/campaigns', 'PUT /api/campaigns/:id', 'DELETE /api/campaigns/:id', 'POST /api/campaigns/:id/metrics'],
    features: ['metrics-tracking', 'scheduling', 'targeting']
  },
  tasks: {
    endpoints: ['GET /api/tasks', 'POST /api/tasks', 'PUT /api/tasks/:id', 'DELETE /api/tasks/:id', 'PUT /api/tasks/:id/status'],
    features: ['assignment', 'due-dates', 'priorities', 'status-updates']
  },
  appointments: {
    endpoints: ['GET /api/appointments', 'POST /api/appointments', 'PUT /api/appointments/:id', 'DELETE /api/appointments/:id'],
    features: ['calendar-sync', 'reminders', 'attendees']
  },
  analytics: {
    endpoints: ['GET /api/analytics/revenue', 'GET /api/analytics/conversions', 'GET /api/analytics/team', 'GET /api/analytics/customers'],
    features: ['aggregation', 'time-series', 'forecasting']
  }
};

// Claude Flow Commands for each module
const generateCommands = () => {
  const commands = [];
  
  Object.entries(crmModules).forEach(([module, config]) => {
    // API Development Command
    commands.push(`
# ${module.toUpperCase()} API Development
npx claude-flow@alpha task_orchestrate \\
  --task "Develop ${module} API with endpoints: ${config.endpoints.join(', ')} including features: ${config.features.join(', ')}" \\
  --priority high \\
  --strategy parallel
`);
    
    // Testing Command
    commands.push(`
# ${module.toUpperCase()} Testing
npx claude-flow@alpha agent_spawn \\
  --type "tester" \\
  --name "${module}-api-tester" \\
  --capabilities '["api-testing", "integration-testing", "performance-testing"]'
`);
  });
  
  return commands.join('\n');
};

// Integration Workflows
const integrationWorkflows = {
  google_calendar: {
    name: "Google Calendar Integration",
    steps: [
      "Setup OAuth2 authentication",
      "Implement calendar sync API",
      "Create appointment mapping",
      "Setup webhook for updates"
    ]
  },
  email_providers: {
    name: "Email Integration (Gmail/Outlook)",
    steps: [
      "Configure OAuth for Gmail",
      "Setup Microsoft Graph for Outlook",
      "Implement send/receive APIs",
      "Create email template system"
    ]
  },
  sms_gateway: {
    name: "SMS Gateway Integration",
    steps: [
      "Select SMS provider (Twilio/MessageBird)",
      "Implement SMS sending API",
      "Setup delivery tracking",
      "Create SMS template system"
    ]
  },
  whatsapp: {
    name: "WhatsApp Business API",
    steps: [
      "Setup WhatsApp Business account",
      "Configure webhook endpoints",
      "Implement message sending",
      "Handle media messages"
    ]
  }
};

// Export workflow configuration
module.exports = {
  crmModules,
  integrationWorkflows,
  generateCommands
};