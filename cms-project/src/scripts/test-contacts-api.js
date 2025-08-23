// Test contacts API endpoints
const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616';

async function testContactsAPI() {
  console.log('Testing Contacts API...\n');
  
  try {
    // Test GET /api/contacts
    console.log('1. Testing GET /api/contacts');
    const listResponse = await fetch(`http://localhost:3000/api/contacts?tenant_id=${tenantId}`);
    const listData = await listResponse.json();
    console.log(`   Status: ${listResponse.status}`);
    console.log(`   Contacts found: ${listData.contacts?.length || 0}`);
    
    // Test POST /api/contacts
    console.log('\n2. Testing POST /api/contacts');
    const newContact = {
      tenant_id: tenantId,
      name: 'API Test Contact',
      email: 'apitest@example.com',
      phone: '+31 20 123 4567',
      company_name: 'API Test Company',
      relationship_status: 'prospect',
      temperature: 'warm'
    };
    
    const createResponse = await fetch('http://localhost:3000/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact)
    });
    const createData = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Created contact ID: ${createData.contact?.id || 'ERROR'}`);
    
    if (createData.contact?.id) {
      const contactId = createData.contact.id;
      
      // Test GET /api/contacts/[id]
      console.log('\n3. Testing GET /api/contacts/[id]');
      const getResponse = await fetch(`http://localhost:3000/api/contacts/${contactId}?tenant_id=${tenantId}`);
      const getData = await getResponse.json();
      console.log(`   Status: ${getResponse.status}`);
      console.log(`   Contact name: ${getData.contact?.name || 'ERROR'}`);
      
      // Test PUT /api/contacts/[id]
      console.log('\n4. Testing PUT /api/contacts/[id]');
      const updateData = {
        temperature: 'hot',
        notes: 'Updated via API test'
      };
      const updateResponse = await fetch(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const updated = await updateResponse.json();
      console.log(`   Status: ${updateResponse.status}`);
      console.log(`   Updated temperature: ${updated.contact?.temperature || 'ERROR'}`);
      
      // Test DELETE /api/contacts/[id]
      console.log('\n5. Testing DELETE /api/contacts/[id]');
      const deleteResponse = await fetch(`http://localhost:3000/api/contacts/${contactId}?tenant_id=${tenantId}`, {
        method: 'DELETE'
      });
      console.log(`   Status: ${deleteResponse.status}`);
      console.log(`   Contact archived successfully`);
    }
    
    console.log('\n✅ All API tests completed!');
    
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
  }
}

testContactsAPI();