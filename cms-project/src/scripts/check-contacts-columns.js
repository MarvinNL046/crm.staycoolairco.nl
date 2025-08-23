const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContactsTable() {
  try {
    // Get table structure
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(0);

    if (error) {
      console.error('Error checking contacts table:', error);
      return;
    }

    // Try a test query to see what happens
    const { data: testData, error: testError } = await supabase
      .from('contacts')
      .select('id, name, company_name, company_id')
      .limit(1);

    if (testError) {
      console.log('Test query error:', testError.message);
      console.log('This tells us which columns don\'t exist');
    } else {
      console.log('Successfully queried columns: id, name, company_name, company_id');
    }

    // Try another approach - query with all expected columns
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'email', 'phone', 'mobile',
      'company_id', 'company_name', 'company', 'job_title',
      'status', 'relationship_status', 'temperature'
    ];

    console.log('\nChecking which columns exist:');
    for (const col of expectedColumns) {
      const { error: colError } = await supabase
        .from('contacts')
        .select(col)
        .limit(1);
      
      if (colError) {
        console.log(`❌ ${col} - DOES NOT EXIST`);
      } else {
        console.log(`✅ ${col} - exists`);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkContactsTable();