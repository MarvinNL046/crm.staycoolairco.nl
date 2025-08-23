const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchemas() {
  console.log('🔍 CHECKING ACTUAL TABLE SCHEMAS\n');
  
  const tablesToCheck = ['products', 'message_templates'];
  
  for (const table of tablesToCheck) {
    console.log(`📋 ${table.toUpperCase()} TABLE STRUCTURE:`);
    console.log('─'.repeat(40));
    
    try {
      // Try to insert empty record to see what fields are required/available
      const { data, error } = await supabase
        .from(table)
        .insert({})
        .select();
        
      if (error) {
        console.log(`Error message reveals required fields: ${error.message}`);
        
        // Extract field names from error message
        if (error.message.includes('null value in column')) {
          const matches = error.message.match(/null value in column "(\w+)"/);
          if (matches) {
            console.log(`Required field: ${matches[1]}`);
          }
        }
      }
      
      // Try to get one record to see the structure
      const { data: sampleData, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (sampleData && sampleData.length > 0) {
        console.log('Available fields:', Object.keys(sampleData[0]).join(', '));
      } else {
        console.log('No sample data available');
      }
      
    } catch (err) {
      console.log(`Error checking ${table}: ${err.message}`);
    }
    
    console.log('');
  }
  
  // Check the exact TypeScript definition we generated earlier
  console.log('🎯 CREATING SIMPLIFIED DATA BASED ON ACTUAL SCHEMA:\n');
  
  // Create products with only the fields that exist
  console.log('📦 Creating Products with basic fields...');
  
  const basicProducts = [
    {
      name: 'Airconditioning Installatie',
      description: 'Complete installatie van airconditioning systeem',
      type: 'service',
      price: 299900, // Store in cents like in TypeScript definition
      tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616'
    },
    {
      name: 'Airco Onderhoud', 
      description: 'Jaarlijks onderhoudsbeurt',
      type: 'service',
      price: 12500,
      tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616'
    },
    {
      name: 'Split-unit Daikin',
      description: 'Daikin split-unit airconditioning 3.5kW',
      type: 'product', 
      price: 89900,
      tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616'
    }
  ];
  
  for (const product of basicProducts) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select();
      
    if (error) {
      console.log(`❌ ${product.name}: ${error.message}`);
    } else {
      console.log(`✅ ${product.name} - €${(product.price/100).toFixed(2)}`);
    }
  }
  
  console.log('\n📧 Creating Message Templates with basic fields...');
  
  const basicTemplates = [
    {
      name: 'Welkom Nieuwe Lead',
      type: 'email',
      subject: 'Welkom bij Staycool Airconditioning!',
      body: 'Beste {{name}}, bedankt voor uw interesse! Wij nemen binnen 24 uur contact op.',
      tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616'
    },
    {
      name: 'Afspraak Bevestiging',
      type: 'sms', 
      subject: '',
      body: 'Hallo {{name}}, uw afspraak is bevestigd op {{date}}. - Staycool',
      tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616'
    }
  ];
  
  for (const template of basicTemplates) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert(template)
      .select();
      
    if (error) {
      console.log(`❌ ${template.name}: ${error.message}`);
    } else {
      console.log(`✅ ${template.name} (${template.type})`);
    }
  }
}

checkTableSchemas();