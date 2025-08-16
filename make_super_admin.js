const PROJECT_REF = 'bdrbfgqgktiuvmynksbe';
const ACCESS_TOKEN = 'sbp_6513ee12cc5b71bbe0cd61b5582d93676c2e3b8e';

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node make_super_admin.js your.email@example.com');
  process.exit(1);
}

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
    
    return data;
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
}

async function makeSuperAdmin(email) {
  console.log(`🚀 Making ${email} a Super Admin...`);
  
  // First check if user exists
  const userCheck = await executeSql(`
    SELECT id, email 
    FROM auth.users 
    WHERE email = '${email}';
  `);
  
  if (!userCheck || userCheck.length === 0) {
    console.log(`❌ User with email ${email} not found in database`);
    console.log('💡 Make sure to register an account first on the live site');
    return;
  }
  
  console.log(`✅ User found: ${userCheck[0].id}`);
  
  // Call the function to make them super admin
  const result = await executeSql(`
    SELECT create_super_admin_user('${email}');
  `);
  
  if (result) {
    console.log('🎉 Successfully created Super Admin!');
    console.log('');
    console.log('🔑 Super Admin Powers Activated:');
    console.log('- ✅ Access to ALL tenants');
    console.log('- ✅ View ALL leads across all companies');
    console.log('- ✅ Manage platform settings');
    console.log('- ✅ View system audit logs');
    console.log('- ✅ Suspend/activate tenant accounts');
    console.log('');
    console.log('🎯 Login to your site and you will have super admin access!');
    
    // Check super admin status
    const checkResult = await executeSql(`
      SELECT sa.email, sa.created_at
      FROM super_admins sa
      WHERE sa.email = '${email}';
    `);
    
    if (checkResult && checkResult.length > 0) {
      console.log(`📋 Super Admin Record: ${checkResult[0].email} (created: ${checkResult[0].created_at})`);
    }
    
  } else {
    console.log('❌ Failed to create Super Admin');
  }
}

makeSuperAdmin(email);