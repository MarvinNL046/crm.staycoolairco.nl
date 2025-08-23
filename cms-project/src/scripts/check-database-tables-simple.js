// Simple script to check all database tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllTables() {
  console.log('🔍 Checking all tables in the database...\n');
  
  try {
    // Get all tables from information_schema
    const { data: tables, error } = await supabase
      .rpc('get_all_tables');
    
    if (error) {
      console.log('⚠️  RPC function not available, trying direct query...\n');
      
      // Fallback: Try to query some known tables
      const knownTables = [
        'profiles', 'customers', 'tenants', 'leads', 'contacts',
        'appointments', 'invoices', 'campaigns', 'workflows',
        'btw_percentages', 'audit_logs', 'super_admins',
        'team_members', 'expenses'
      ];
      
      console.log('📋 Checking known tables:\n');
      
      for (const tableName of knownTables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.log(`❌ ${tableName}: Table does not exist or no access`);
          } else {
            console.log(`✅ ${tableName}: ${count} rows`);
          }
        } catch (e) {
          console.log(`❌ ${tableName}: Error - ${e.message}`);
        }
      }
    } else {
      console.log('📊 All tables found:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getAllTables();