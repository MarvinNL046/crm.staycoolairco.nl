const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingTables() {
  console.log('🔍 CHECKING MISSING COMMUNICATION TABLES\n');
  
  // Check if these tables exist in the schema but are missing from the API
  const missingTables = ['email_logs', 'sms_logs'];
  
  for (const table of missingTables) {
    console.log(`📧 Checking ${table}...`);
    
    try {
      // Try different approaches to check table existence
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        
        // Check if it's a permissions issue or table doesn't exist
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   → Table "${table}" doesn't exist in database schema`);
        } else if (error.message.includes('permission')) {
          console.log(`   → Table "${table}" exists but has permission issues`);
        } else {
          console.log(`   → Unknown error for table "${table}"`);
        }
      } else {
        console.log(`✅ ${table}: Found with ${count} records`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Exception - ${err.message}`);
    }
    console.log('');
  }
}

async function analyzeCRMGaps() {
  console.log('🎯 CRM FUNCTIONALITY GAP ANALYSIS\n');
  console.log('Based on empty tables, these CRM features need implementation:\n');
  
  const functionalityMap = {
    'contacts': {
      feature: '👥 Contact Management',
      description: 'Convert leads to contacts, manage customer relationships',
      priority: 'HIGH',
      dependencies: 'Leads system (✅ active)'
    },
    'customers': {
      feature: '🏢 Customer Management', 
      description: 'Customer lifecycle, purchase history, customer value tracking',
      priority: 'HIGH',
      dependencies: 'Contacts, Deals'
    },
    'deals': {
      feature: '💰 Sales Pipeline Management',
      description: 'Opportunity tracking, deal stages, revenue forecasting',
      priority: 'CRITICAL',
      dependencies: 'Pipeline stages (✅ configured), Contacts'
    },
    'appointments': {
      feature: '📅 Calendar & Appointments',
      description: 'Meeting scheduling, calendar integration, appointment reminders',
      priority: 'HIGH',
      dependencies: 'Contacts, Team members'
    },
    'activities': {
      feature: '✅ Activity Tracking',
      description: 'Tasks, follow-ups, activity logging, productivity tracking',
      priority: 'MEDIUM',
      dependencies: 'Leads, Contacts'
    },
    'tasks': {
      feature: '📋 Task Management',
      description: 'Team task assignment, deadlines, task automation',
      priority: 'MEDIUM', 
      dependencies: 'Team members, Activities'
    },
    'invoices': {
      feature: '🧾 Invoicing System',
      description: 'Quote generation, invoice creation, payment tracking',
      priority: 'CRITICAL',
      dependencies: 'Customers, Products, Invoice sequences'
    },
    'products': {
      feature: '📦 Product/Service Catalog',
      description: 'Service offerings, pricing, product management',
      priority: 'HIGH',
      dependencies: 'None'
    },
    'automations': {
      feature: '🤖 Marketing Automation',
      description: 'Email sequences, lead nurturing, automated workflows',
      priority: 'MEDIUM',
      dependencies: 'Message templates, Email logs'
    },
    'message_templates': {
      feature: '📧 Email/SMS Templates',
      description: 'Pre-built communication templates, personalization',
      priority: 'HIGH',
      dependencies: 'None'
    },
    'campaigns': {
      feature: '📈 Marketing Campaigns',
      description: 'Campaign management, tracking, ROI analysis',
      priority: 'LOW',
      dependencies: 'Analytics events, Message templates'
    },
    'team_members': {
      feature: '👥 Team Management',
      description: 'User roles, permissions, team collaboration',
      priority: 'HIGH',
      dependencies: 'None'
    },
    'call_logs': {
      feature: '📞 Call Management',
      description: 'Call logging, phone integration, call analytics',
      priority: 'MEDIUM',
      dependencies: 'Contacts, Team members'
    },
    'analytics_events': {
      feature: '📊 Analytics & Reporting',
      description: 'Performance tracking, business intelligence, dashboards',
      priority: 'MEDIUM',
      dependencies: 'All other modules'
    },
    'integrations': {
      feature: '🔗 Third-party Integrations',
      description: 'External tool connections, data sync, API management',
      priority: 'LOW',
      dependencies: 'API keys'
    },
    'api_keys': {
      feature: '🔐 API Access Management',
      description: 'API authentication, rate limiting, access control',
      priority: 'LOW',
      dependencies: 'Team members'
    }
  };
  
  // Group by priority
  const critical = [];
  const high = [];
  const medium = [];
  const low = [];
  
  Object.entries(functionalityMap).forEach(([table, info]) => {
    const item = `${info.feature}\n   📝 ${info.description}\n   🔗 Needs: ${info.dependencies}`;
    
    switch(info.priority) {
      case 'CRITICAL': critical.push(item); break;
      case 'HIGH': high.push(item); break;
      case 'MEDIUM': medium.push(item); break;
      case 'LOW': low.push(item); break;
    }
  });
  
  console.log('🚨 CRITICAL PRIORITY (Revenue Impact):');
  console.log('═'.repeat(50));
  critical.forEach((item, i) => console.log(`${i+1}. ${item}\n`));
  
  console.log('⚠️  HIGH PRIORITY (Core CRM Functions):');
  console.log('═'.repeat(50));
  high.forEach((item, i) => console.log(`${i+1}. ${item}\n`));
  
  console.log('📋 MEDIUM PRIORITY (Efficiency Features):');
  console.log('═'.repeat(50));
  medium.forEach((item, i) => console.log(`${i+1}. ${item}\n`));
  
  console.log('📈 LOW PRIORITY (Advanced Features):');
  console.log('═'.repeat(50));
  low.forEach((item, i) => console.log(`${i+1}. ${item}\n`));
}

async function recommendImplementationOrder() {
  console.log('🛣️  RECOMMENDED IMPLEMENTATION ROADMAP\n');
  
  const phases = [
    {
      phase: 'Phase 1 - Foundation (Week 1-2)',
      features: [
        '🏗️  Create email_logs & sms_logs tables',
        '📦 Product/Service Catalog setup',
        '📧 Message Templates creation',
        '👥 Team Management basic setup'
      ]
    },
    {
      phase: 'Phase 2 - Core CRM (Week 3-4)', 
      features: [
        '👥 Contact Management (lead conversion)',
        '🏢 Customer Management', 
        '💰 Sales Pipeline & Deal tracking',
        '🧾 Basic Invoicing system'
      ]
    },
    {
      phase: 'Phase 3 - Productivity (Week 5-6)',
      features: [
        '📅 Calendar & Appointments',
        '✅ Activity & Task Management',
        '📞 Call Management integration',
        '📊 Basic Analytics dashboard'
      ]
    },
    {
      phase: 'Phase 4 - Automation (Week 7-8)',
      features: [
        '🤖 Marketing Automation workflows',
        '📈 Campaign Management',
        '🔗 Key Integrations (email, phone)',
        '🔐 API Access Management'
      ]
    }
  ];
  
  phases.forEach(phase => {
    console.log(phase.phase);
    console.log('─'.repeat(40));
    phase.features.forEach(feature => console.log(`  ${feature}`));
    console.log('');
  });
  
  console.log('🎯 SUCCESS METRICS PER PHASE:');
  console.log('═'.repeat(40));
  console.log('Phase 1: All tables created, basic data entry possible');
  console.log('Phase 2: Complete lead-to-customer-to-invoice workflow');
  console.log('Phase 3: Team productivity tools fully functional');
  console.log('Phase 4: Automated workflows reducing manual work by 50%+');
}

async function main() {
  await checkMissingTables();
  await analyzeCRMGaps();
  await recommendImplementationOrder();
}

main().catch(console.error);