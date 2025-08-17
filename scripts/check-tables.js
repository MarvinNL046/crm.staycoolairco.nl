const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingTables() {
  try {
    console.log('Checking existing tables in Supabase...\n');
    
    // List of tables we expect
    const expectedTables = [
      'tenants', 'user_tenants', 'leads', 'customers', 'contacts', 
      'deals', 'campaigns', 'tasks', 'appointments', 'call_logs',
      'templates', 'team_members', 'integrations', 'api_keys',
      'analytics_events', 'automation_triggers', 'email_settings',
      'messaging_settings', 'webhook_settings', 'automations'
    ];

    console.log('Checking which tables exist by trying to query them:\n');
    
    const existingTables = [];
    const missingTables = [];
    
    for (const table of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push(table);
          console.log(`✅ ${table} - exists (${count} rows)`);
        } else {
          missingTables.push(table);
          console.log(`❌ ${table} - does not exist`);
        }
      } catch (err) {
        missingTables.push(table);
        console.log(`❌ ${table} - does not exist`);
      }
    }
    
    console.log('\n\nSummary:');
    console.log(`Existing tables (${existingTables.length}):`, existingTables.join(', '));
    console.log(`Missing tables (${missingTables.length}):`, missingTables.join(', '));

    // Also check for the auth schema tables
    console.log('\n\nChecking auth schema:');
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (!error) {
        console.log(`✅ auth.users - accessible (${users?.length || 0} users)`);
      } else {
        console.log(`ℹ️  auth.users - exists but requires admin access`);
      }
    } catch {
      console.log(`ℹ️  auth.users - exists but requires admin access`);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkExistingTables();