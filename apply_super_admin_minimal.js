const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'bdrbfgqgktiuvmynksbe';
const ACCESS_TOKEN = 'sbp_6513ee12cc5b71bbe0cd61b5582d93676c2e3b8e';

// Read the SQL migration file
const sqlFilePath = path.join(__dirname, 'SUPER_ADMIN_MINIMAL.sql');
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
    
    console.log('✅ Super Admin tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Applying Minimal Super Admin setup...');
  console.log('📄 SQL file:', sqlFilePath);
  console.log('📊 SQL length:', sqlContent.length, 'characters');
  
  const success = await executeSql(sqlContent);
  
  if (success) {
    console.log('🎉 Super Admin system successfully deployed!');
    console.log('');
    console.log('🔑 Next steps to become super admin:');
    console.log('1. Register your account on the live site');
    console.log('2. Note your email address');
    console.log('3. Run: node make_super_admin.js YOUR_EMAIL@example.com');
    console.log('');
    console.log('🏗️ Super Admin Features Added:');
    console.log('- ✅ super_admins table');
    console.log('- ✅ platform_settings table');
    console.log('- ✅ system_audit_log table'); 
    console.log('- ✅ Enhanced RLS policies with super admin bypass');
    console.log('- ✅ Functions: create_super_admin_user(), is_super_admin()');
    console.log('- ✅ SaaS columns added to tenants table');
    console.log('');
    console.log('💼 Super Admin Powers:');
    console.log('- View and manage ALL tenants');
    console.log('- Access ALL leads across all tenants');
    console.log('- Manage platform settings');
    console.log('- View system audit logs');
    console.log('- Suspend/activate tenants');
  } else {
    console.log('❌ Failed to apply migration.');
  }
}

main();