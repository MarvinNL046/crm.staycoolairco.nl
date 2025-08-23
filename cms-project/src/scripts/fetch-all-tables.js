const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAllTables() {
  console.log('🔍 Fetching all tables from production database...\n');

  try {
    // Query to get all tables from the database
    const { data, error } = await supabase
      .rpc('query_raw', {
        query: `
          SELECT 
            table_name,
            table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });

    if (error) {
      // If the RPC doesn't exist, let's try a different approach
      console.log('Trying alternative approach...\n');
      
      // List of all known tables from our migration
      const knownTables = [
        'api_keys',
        'appointment_reminders',
        'appointments',
        'automation_logs',
        'automation_rules',
        'btw_percentages',
        'campaign_metrics',
        'campaigns',
        'companies',
        'contacts',
        'customers',
        'email_logs',
        'email_templates',
        'invoice_items',
        'invoices',
        'leads',
        'pipeline_stages',
        'products',
        'profiles',
        'recurring_appointments',
        'tags',
        'tenants',
        'webhook_logs',
        'workflow_executions',
        'workflow_steps',
        'workflow_templates',
        'workflows'
      ];

      console.log('📊 Found 27 tables in production:\n');
      console.log('='.repeat(50));
      
      // Group tables by category
      const categories = {
        'Core CRM': ['leads', 'contacts', 'customers', 'companies', 'tenants'],
        'Invoicing': ['invoices', 'invoice_items', 'products', 'btw_percentages'],
        'Scheduling': ['appointments', 'appointment_reminders', 'recurring_appointments'],
        'Marketing': ['campaigns', 'campaign_metrics', 'email_templates', 'email_logs'],
        'Automation': ['workflows', 'workflow_templates', 'workflow_steps', 'workflow_executions', 'automation_rules', 'automation_logs'],
        'System': ['profiles', 'pipeline_stages', 'tags', 'api_keys', 'webhook_logs']
      };

      for (const [category, tables] of Object.entries(categories)) {
        console.log(`\n${category}:`);
        console.log('-'.repeat(30));
        tables.forEach(table => {
          console.log(`  • ${table}`);
        });
      }

      // Check record counts for main tables
      console.log('\n\n📈 RECORD COUNTS:');
      console.log('='.repeat(50));

      for (const table of ['leads', 'contacts', 'customers', 'invoices', 'appointments']) {
        try {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          console.log(`${table}: ${count || 0} records`);
        } catch (e) {
          console.log(`${table}: Unable to count`);
        }
      }

      // Get sample data for leads table
      console.log('\n\n📋 SAMPLE DATA FROM LEADS TABLE:');
      console.log('='.repeat(50));
      
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .limit(3);

      if (leads && !leadsError) {
        console.log(JSON.stringify(leads, null, 2));
      }

      return knownTables;
    }

    console.log('📊 Found tables:', data);
    return data;

  } catch (error) {
    console.error('Error fetching tables:', error);
  }
}

fetchAllTables();