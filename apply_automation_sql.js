const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'bdrbfgqgktiuvmynksbe';
const ACCESS_TOKEN = 'sbp_6513ee12cc5b71bbe0cd61b5582d93676c2e3b8e';

// Read the SQL migration file
const sqlFilePath = path.join(__dirname, 'supabase/migrations/20250816162643_automation_system.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

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
      console.error('❌ Error executing SQL:', data);
      return false;
    }
    
    console.log('✅ SQL executed successfully');
    console.log('Result:', data);
    return true;
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

// Execute the automation system SQL
async function main() {
  console.log('🚀 Applying automation system migration...');
  console.log('📄 SQL file:', sqlFilePath);
  console.log('📊 SQL length:', sqlContent.length, 'characters');
  
  const success = await executeSql(sqlContent);
  
  if (success) {
    console.log('🎉 Automation system successfully deployed to Supabase!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to Dashboard → Settings');
    console.log('2. Click "Standaard Regels Aanmaken" in Automation Settings');
    console.log('3. Test automation by creating a test lead');
  } else {
    console.log('❌ Failed to apply migration. Please try manually via Supabase Dashboard.');
  }
}

main();