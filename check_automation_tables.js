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

async function checkTables() {
  console.log('🔍 Checking automation tables...');
  
  // Check if automation_rules table exists
  const tablesResult = await executeSql(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('automation_rules', 'automation_executions');
  `);
  
  if (tablesResult) {
    console.log('📋 Existing automation tables:', tablesResult);
    
    if (tablesResult.length > 0) {
      // Check if function exists
      const functionResult = await executeSql(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname = 'create_default_automation_rules';
      `);
      
      console.log('🔧 Function exists:', functionResult);
      
      // Check existing automation rules
      const rulesResult = await executeSql(`
        SELECT id, name, trigger_type, enabled 
        FROM automation_rules 
        LIMIT 10;
      `);
      
      console.log('⚙️ Existing automation rules:', rulesResult);
      
      if (rulesResult && rulesResult.length === 0) {
        console.log('');
        console.log('✅ Tables exist but no rules found.');
        console.log('💡 You can create default rules from Settings → Automation Regels');
      } else {
        console.log('');
        console.log('✅ Automation system is already set up!');
        console.log('🎯 You can manage rules from Settings → Automation Regels');
      }
    }
  }
}

checkTables();