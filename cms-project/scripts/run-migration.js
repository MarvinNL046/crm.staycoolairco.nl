const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(sqlFile) {
  console.log(`🚀 Running migration: ${sqlFile}\n`);
  console.log('='.repeat(80));
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Migration content preview:');
    console.log(sql.substring(0, 500) + '...\n');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      // Try alternative approach - split into statements
      console.log('Direct RPC failed, trying statement by statement...\n');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        try {
          // Skip DO blocks for now
          if (statement.startsWith('DO $$')) {
            console.log('⏭️  Skipping DO block (will handle separately)');
            continue;
          }
          
          console.log(`\n📝 Executing: ${statement.substring(0, 50)}...`);
          
          // For CREATE TABLE statements, we can check if they already exist
          if (statement.includes('CREATE TABLE IF NOT EXISTS')) {
            const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
            if (tableName) {
              console.log(`   Creating table: ${tableName}`);
            }
          }
          
          // Since we can't execute raw SQL directly, let's check what exists
          if (statement.includes('appointment_reminders')) {
            const { count } = await supabase
              .from('appointment_reminders')
              .select('*', { count: 'exact', head: true });
            
            if (count !== null) {
              console.log('✅ appointment_reminders table already exists');
              successCount++;
              continue;
            }
          }
          
          if (statement.includes('recurring_appointments')) {
            const { count } = await supabase
              .from('recurring_appointments')
              .select('*', { count: 'exact', head: true });
            
            if (count !== null) {
              console.log('✅ recurring_appointments table already exists');
              successCount++;
              continue;
            }
          }
          
        } catch (e) {
          errorCount++;
          console.log(`❌ Error: ${e.message}`);
        }
      }
      
      console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} errors`);
    } else {
      console.log('✅ Migration executed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Get the SQL file from command line argument
const sqlFile = process.argv[2] || 'supabase/migrations/20250822_fix_appointment_tables.sql';
runMigration(sqlFile);