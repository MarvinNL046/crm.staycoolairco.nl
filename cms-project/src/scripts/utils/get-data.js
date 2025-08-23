const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllTableData() {
  console.log('🔍 FETCHING ALL DATABASE TABLES DATA...\n');
  
  // List of main business tables to query
  const tables = [
    'tenants', 'leads', 'contacts', 'customers', 'deals', 
    'appointments', 'activities', 'invoices', 'invoice_items',
    'products', 'campaigns', 'messages', 'automations',
    'team_members', 'analytics_events'
  ];
  
  for (const table of tables) {
    try {
      console.log(`📊 TABLE: ${table.toUpperCase()}`);
      console.log('═'.repeat(50));
      
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5); // Only show first 5 rows per table
      
      if (error) {
        console.log(`❌ Error: ${error.message}\n`);
        continue;
      }
      
      console.log(`📈 Total records: ${count || 0}`);
      
      if (data && data.length > 0) {
        console.log('🔢 Sample data (first 5 rows):');
        console.table(data);
      } else {
        console.log('📭 No data found in this table');
      }
      
      console.log('\n');
      
    } catch (err) {
      console.log(`❌ Error querying ${table}: ${err.message}\n`);
    }
  }
}

getAllTableData().catch(console.error);