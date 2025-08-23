const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBasicData() {
  console.log('🎯 CREATING BASIC CRM DATA\n');
  
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';
  
  // Based on the TypeScript definitions, let's try with minimal required fields
  console.log('📦 Creating Products (minimal fields)...');
  
  // From TypeScript def: products table has name, tenant_id as required
  const minimalProducts = [
    {
      name: 'Airconditioning Installatie',
      tenant_id: tenantId
    },
    {
      name: 'Airco Onderhoud',
      tenant_id: tenantId
    },
    {
      name: 'Split-unit Daikin',
      tenant_id: tenantId
    }
  ];
  
  for (const product of minimalProducts) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select();
      
    if (error) {
      console.log(`❌ ${product.name}: ${error.message}`);
    } else {
      console.log(`✅ Product: ${product.name}`);
    }
  }
  
  console.log('\n📧 Creating Message Templates (minimal fields)...');
  
  // From TypeScript def: message_templates has name, tenant_id as required
  const minimalTemplates = [
    {
      name: 'Welkom Nieuwe Lead',
      tenant_id: tenantId
    },
    {
      name: 'Afspraak Bevestiging', 
      tenant_id: tenantId
    }
  ];
  
  for (const template of minimalTemplates) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert(template)
      .select();
      
    if (error) {
      console.log(`❌ ${template.name}: ${error.message}`);
    } else {
      console.log(`✅ Template: ${template.name}`);
    }
  }
  
  // Let's try to add some sample contact data since we can convert the lead
  console.log('\n👥 Converting Lead to Contact...');
  
  const leadId = 'a1823cf1-eae4-46d7-b4af-b5245e1c4067'; // From our earlier query
  
  const contactData = {
    name: 'Marvin Smit',
    email: 'Marvinsmit1988@gmail.com', 
    phone: '+31636481054',
    company: 'Staycool Airconditioning',
    converted_from_lead_id: leadId,
    converted_at: new Date().toISOString(),
    tenant_id: tenantId
  };
  
  const { data: contactResult, error: contactError } = await supabase
    .from('contacts')
    .insert(contactData)
    .select();
    
  if (contactError) {
    console.log(`❌ Contact creation: ${contactError.message}`);
  } else {
    console.log(`✅ Contact created: ${contactData.name}`);
    
    // Update the lead to mark it as converted
    const { error: leadUpdateError } = await supabase
      .from('leads')
      .update({ 
        converted_to_contact_id: contactResult[0].id,
        converted_at: new Date().toISOString()
      })
      .eq('id', leadId);
      
    if (!leadUpdateError) {
      console.log('✅ Lead marked as converted');
    }
  }
  
  // Create a basic customer from the contact
  console.log('\n🏢 Creating Customer...');
  
  const customerData = {
    name: 'Marvin Smit',
    email: 'Marvinsmit1988@gmail.com',
    company: 'Staycool Airconditioning',
    status: 'active',
    tenant_id: tenantId
  };
  
  const { data: customerResult, error: customerError } = await supabase
    .from('customers')
    .insert(customerData)
    .select();
    
  if (customerError) {
    console.log(`❌ Customer creation: ${customerError.message}`);
  } else {
    console.log(`✅ Customer created: ${customerData.name}`);
  }
  
  // Verify what we have now
  console.log('\n📊 CURRENT DATABASE STATUS:');
  console.log('═'.repeat(50));
  
  const tables = ['tenants', 'leads', 'contacts', 'customers', 'products', 'message_templates', 'pipeline_stages'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .limit(1);
      
    if (!error) {
      console.log(`✅ ${table}: ${count} records`);
    }
  }
  
  console.log('\n🎉 BASIC CRM DATA SETUP COMPLETE!');
  console.log('Ready for Phase 2: Enhanced functionality and UI integration');
}

createBasicData();