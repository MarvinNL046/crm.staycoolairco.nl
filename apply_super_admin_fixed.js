const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'bdrbfgqgktiuvmynksbe';
const ACCESS_TOKEN = 'sbp_6513ee12cc5b71bbe0cd61b5582d93676c2e3b8e';

// Read the SQL migration file
const sqlFilePath = path.join(__dirname, 'SUPER_ADMIN_MIGRATION_FIXED.sql');
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
    
    console.log('✅ Super Admin migration applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Applying Super Admin migration (Fixed version)...');
  console.log('📄 SQL file:', sqlFilePath);
  console.log('📊 SQL length:', sqlContent.length, 'characters');
  
  const success = await executeSql(sqlContent);
  
  if (success) {
    console.log('🎉 Super Admin system successfully deployed!');
    console.log('');
    console.log('🔑 Next steps:');
    console.log('1. Register your account normally on the live site');
    console.log('2. Note down your email address');
    console.log('3. Run this command to make yourself super admin:');
    console.log('   node make_super_admin.js YOUR_EMAIL@example.com');
    console.log('4. You will then have super admin powers!');
    console.log('');
    console.log('🏗️ Super Admin Features Added:');
    console.log('- ✅ User roles (super_admin, tenant_admin, tenant_user, tenant_viewer)');
    console.log('- ✅ Super admin table (separate from auth.users)');
    console.log('- ✅ Tenant status management (active, suspended, trial, cancelled)'); 
    console.log('- ✅ Usage tracking and analytics');
    console.log('- ✅ Billing and subscription management');
    console.log('- ✅ White-label customization per tenant');
    console.log('- ✅ System audit logging');
    console.log('- ✅ Platform-wide settings');
    console.log('- ✅ Enhanced RLS policies with super admin bypass');
  } else {
    console.log('❌ Failed to apply migration.');
  }
}

main();