const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

// All tables from the generated TypeScript types
const allTables = [
  'activities', 'analytics_events', 'api_keys', 'appointments', 'automation_executions',
  'automation_rules', 'automation_triggers', 'automations', 'call_logs', 'campaigns',
  'contacts', 'customers', 'deals', 'integrations', 'invoice_items', 'invoice_sequences',
  'invoices', 'leads', 'message_templates', 'pipeline_stages', 'products', 'sms_logs',
  'tasks', 'team_members', 'tenants', 'email_logs'
];

async function checkAllTables() {
  console.log('🔍 COMPREHENSIVE DATABASE AUDIT\n');
  console.log(`📊 Checking ${allTables.length} tables...\n`);
  
  const results = [];
  
  for (const table of allTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        results.push({
          table,
          status: '❌ ERROR',
          count: 0,
          error: error.message
        });
      } else {
        results.push({
          table,
          status: count > 0 ? '✅ HAS DATA' : '📭 EMPTY',
          count: count || 0,
          sampleData: data && data.length > 0 ? data[0] : null
        });
      }
    } catch (err) {
      results.push({
        table,
        status: '❌ ERROR',
        count: 0,
        error: err.message
      });
    }
  }
  
  // Summary
  console.log('📈 DATABASE SUMMARY');
  console.log('═'.repeat(80));
  results.forEach(result => {
    console.log(`${result.status.padEnd(12)} ${result.table.padEnd(25)} (${result.count} records)`);
  });
  
  console.log('\n🔥 TABLES WITH DATA:');
  console.log('═'.repeat(80));
  
  const tablesWithData = results.filter(r => r.count > 0);
  
  for (const result of tablesWithData) {
    console.log(`\n📊 ${result.table.toUpperCase()} (${result.count} records)`);
    console.log('─'.repeat(50));
    
    if (result.sampleData) {
      // Show structure
      const fields = Object.keys(result.sampleData);
      console.log(`🏗️  Structure: ${fields.join(', ')}`);
      
      // Show sample data in a clean format
      console.log('📋 Sample record:');
      for (const [key, value] of Object.entries(result.sampleData)) {
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        console.log(`   ${key}: ${displayValue}`);
      }
    }
  }
  
  console.log('\n📊 STATISTICS');
  console.log('═'.repeat(40));
  console.log(`Total tables: ${results.length}`);
  console.log(`Tables with data: ${tablesWithData.length}`);
  console.log(`Empty tables: ${results.filter(r => r.count === 0 && r.status !== '❌ ERROR').length}`);
  console.log(`Error tables: ${results.filter(r => r.status === '❌ ERROR').length}`);
  console.log(`Total records: ${tablesWithData.reduce((sum, r) => sum + r.count, 0)}`);
}

checkAllTables().catch(console.error);