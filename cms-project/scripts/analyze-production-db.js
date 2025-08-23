const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  console.log('🔍 Analyzing production database...\n');

  try {
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log(`📊 Found ${tables.length} tables in production:\n`);
    
    // Group tables by category
    const categories = {
      core: ['contacts', 'leads', 'customers', 'companies'],
      invoicing: ['invoices', 'invoice_items', 'products', 'btw_percentages'],
      communication: ['email_templates', 'email_logs', 'messages', 'campaigns', 'campaign_metrics'],
      workflow: ['workflows', 'workflow_templates', 'workflow_executions', 'workflow_steps'],
      appointments: ['appointments', 'appointment_reminders', 'recurring_appointments'],
      system: ['profiles', 'tenants', 'pipeline_stages', 'tags', 'api_keys', 'webhook_logs'],
      other: []
    };

    // Categorize tables
    const categorizedTables = {};
    
    tables.forEach(({ table_name }) => {
      let categorized = false;
      for (const [category, patterns] of Object.entries(categories)) {
        if (category === 'other') continue;
        
        if (patterns.some(pattern => table_name.includes(pattern))) {
          if (!categorizedTables[category]) categorizedTables[category] = [];
          categorizedTables[category].push(table_name);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        if (!categorizedTables.other) categorizedTables.other = [];
        categorizedTables.other.push(table_name);
      }
    });

    // Display categorized tables
    for (const [category, tableList] of Object.entries(categorizedTables)) {
      if (tableList && tableList.length > 0) {
        console.log(`\n${category.toUpperCase()} (${tableList.length} tables):`);
        console.log('-'.repeat(50));
        tableList.forEach(table => console.log(`  - ${table}`));
      }
    }

    // Get detailed info for core tables
    console.log('\n\n📋 DETAILED SCHEMA FOR CORE TABLES:');
    console.log('='.repeat(60));

    const coreTables = ['leads', 'contacts', 'customers', 'invoices', 'appointments'];
    
    for (const tableName of coreTables) {
      if (!tables.some(t => t.table_name === tableName)) continue;

      console.log(`\n\n🔷 ${tableName.toUpperCase()}`);
      console.log('-'.repeat(40));

      // Get columns for this table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) {
        console.error(`Error fetching columns for ${tableName}:`, columnsError);
        continue;
      }

      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
    }

    // Count records in important tables
    console.log('\n\n📊 RECORD COUNTS:');
    console.log('='.repeat(60));

    for (const tableName of ['leads', 'contacts', 'customers', 'invoices', 'appointments']) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`${tableName}: ${count || 0} records`);
        }
      } catch (e) {
        console.log(`${tableName}: Unable to count`);
      }
    }

  } catch (error) {
    console.error('Error analyzing database:', error);
  }
}

analyzeDatabase();