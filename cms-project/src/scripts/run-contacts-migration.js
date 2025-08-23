const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running contacts table migration...\n');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../src/sql/migrations/add-missing-contacts-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 80) + '...\n');
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).catch(async (rpcError) => {
        // If RPC doesn't exist, try direct query (won't work for DDL but worth trying)
        console.log('RPC not available, statement needs to be run directly in Supabase dashboard');
        return { error: 'RPC not available' };
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        console.log('\nPlease run this migration directly in the Supabase SQL editor.\n');
        break;
      }
    }
    
    console.log('\nMigration instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log(`   ${migrationPath}`);
    console.log('4. Execute the SQL\n');
    
    // Test if migration worked
    console.log('Testing current table structure...');
    const { data: testData, error: testError } = await supabase
      .from('contacts')
      .select('id, name, company_name, relationship_status, temperature')
      .limit(1);
    
    if (testError) {
      console.log('Some columns are still missing:', testError.message);
    } else {
      console.log('✅ Key columns appear to be available!');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

runMigration();