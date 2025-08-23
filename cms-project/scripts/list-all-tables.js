const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  console.log('📊 COMPLETE TABLE LIST FROM PRODUCTION\n');
  console.log('='.repeat(80));
  
  const allPossibleTables = [
    // Core CRM
    'tenants', 'profiles', 'leads', 'contacts', 'customers', 'companies',
    
    // Invoicing
    'invoices', 'invoice_items', 'products', 'btw_percentages',
    
    // Appointments
    'appointments', 'appointment_reminders', 'recurring_appointments',
    
    // Communication
    'campaigns', 'campaign_metrics', 'email_templates', 'email_logs',
    
    // Automation
    'workflows', 'workflow_templates', 'workflow_steps', 'workflow_executions',
    'automation_rules', 'automation_logs',
    
    // Config
    'pipeline_stages', 'tags', 'api_keys', 'webhook_logs'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  console.log('Checking each table...\n');
  
  for (const table of allPossibleTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('schema cache')) {
          console.log(`❌ ${table.padEnd(25)} - NOT IN SCHEMA CACHE`);
          missingTables.push(table);
        } else {
          console.log(`⚠️  ${table.padEnd(25)} - ${error.code}`);
          missingTables.push(table);
        }
      } else {
        console.log(`✅ ${table.padEnd(25)} - ${count || 0} records`);
        existingTables.push({ table, count: count || 0 });
      }
    } catch (e) {
      console.log(`❌ ${table.padEnd(25)} - ERROR`);
      missingTables.push(table);
    }
  }
  
  console.log('\n\n📊 SUMMARY:\n');
  console.log('='.repeat(80));
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    console.log('-'.repeat(50));
    
    const categories = {
      'Config': ['btw_percentages', 'tags', 'email_templates'],
      'Automation': ['workflow_steps', 'automation_logs'],
      'Other': []
    };
    
    missingTables.forEach(table => {
      let categorized = false;
      for (const [cat, tables] of Object.entries(categories)) {
        if (tables.includes(table)) {
          if (!categories[cat].printed) {
            console.log(`\n${cat}:`);
            categories[cat].printed = true;
          }
          console.log(`  - ${table}`);
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        if (!categories.Other.printed) {
          console.log('\nOther:');
          categories.Other.printed = true;
        }
        console.log(`  - ${table}`);
      }
    });
    
    console.log('\n\n🎯 BELANGRIJKE ONTBREKENDE TABELLEN:');
    console.log('-'.repeat(50));
    console.log('1. btw_percentages - NODIG voor facturatie!');
    console.log('2. tags - NODIG voor lead categorisatie');
    console.log('3. email_templates - NODIG voor automatische emails');
    
    console.log('\n💡 Deze tabellen bestaan wel in je lokale migration');
    console.log('   maar zijn niet aangemaakt in productie.');
  }
  
  console.log('\n\n📈 TABLES MET DATA:');
  console.log('-'.repeat(50));
  existingTables
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .forEach(t => {
      console.log(`${t.table.padEnd(25)} - ${t.count} records`);
    });
}

listAllTables();