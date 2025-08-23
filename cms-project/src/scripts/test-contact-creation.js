const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testContactCreation() {
  try {
    console.log('Testing contact creation with all new fields...\n');
    
    // Get a tenant_id to use
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    if (!tenants || tenants.length === 0) {
      console.error('No tenants found');
      return;
    }
    
    const tenant_id = tenants[0].id;
    console.log('Using tenant_id:', tenant_id);
    
    // Create a test contact with all fields
    const testContact = {
      tenant_id,
      name: 'Test Contact',
      email: 'test@example.com',
      phone: '+31 20 123 4567',
      mobile: '+31 6 1234 5678',
      company_name: 'Test Company B.V.',
      job_title: 'Test Manager',
      department: 'Sales',
      status: 'active',
      relationship_status: 'prospect',
      temperature: 'warm',
      address_line1: 'Teststraat 123',
      city: 'Amsterdam',
      postal_code: '1234 AB',
      country: 'Nederland',
      preferred_contact_method: 'email',
      do_not_call: false,
      do_not_email: false,
      notes: 'This is a test contact created to verify all fields work',
      tags: ['test', 'demo']
    };
    
    console.log('\nCreating contact...');
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([testContact])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      return;
    }
    
    console.log('\n✅ Contact created successfully!');
    console.log('Contact ID:', contact.id);
    console.log('Name:', contact.name);
    console.log('Company:', contact.company_name);
    console.log('Temperature:', contact.temperature);
    console.log('Relationship Status:', contact.relationship_status);
    
    // Clean up - delete the test contact
    console.log('\nCleaning up...');
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);
    
    if (deleteError) {
      console.error('Error deleting test contact:', deleteError);
    } else {
      console.log('✅ Test contact deleted');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testContactCreation();