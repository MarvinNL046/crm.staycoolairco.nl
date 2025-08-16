const PROJECT_REF = 'bdrbfgqgktiuvmynksbe';
const ACCESS_TOKEN = 'sbp_6513ee12cc5b71bbe0cd61b5582d93676c2e3b8e';

// Function to execute SQL via Supabase REST API
async function executeSql(sql) {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error:', data);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
}

async function checkSchema() {
  console.log('🔍 Checking existing schema...');
  
  // Check existing tables
  const tablesResult = await executeSql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  if (tablesResult) {
    console.log('📋 Existing tables:');
    tablesResult.forEach(table => console.log(`  - ${table.table_name}`));
  }
  
  // Check existing enums
  const enumsResult = await executeSql(`
    SELECT t.typname as enum_name,
           e.enumlabel as enum_value
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typtype = 'e'
    ORDER BY t.typname, e.enumsortorder;
  `);
  
  if (enumsResult) {
    console.log('');
    console.log('🏷️ Existing enums:');
    const enumGroups = {};
    enumsResult.forEach(row => {
      if (!enumGroups[row.enum_name]) {
        enumGroups[row.enum_name] = [];
      }
      enumGroups[row.enum_name].push(row.enum_value);
    });
    
    Object.keys(enumGroups).forEach(enumName => {
      console.log(`  - ${enumName}: [${enumGroups[enumName].join(', ')}]`);
    });
  }
  
  // Check tenant_users structure
  const tenantUsersResult = await executeSql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'tenant_users' 
    ORDER BY ordinal_position;
  `);
  
  if (tenantUsersResult) {
    console.log('');
    console.log('👥 tenant_users columns:');
    tenantUsersResult.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  }
  
  // Check tenants structure  
  const tenantsResult = await executeSql(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'tenants' 
    ORDER BY ordinal_position;
  `);
  
  if (tenantsResult) {
    console.log('');
    console.log('🏢 tenants columns:');
    tenantsResult.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
  }
}

checkSchema();