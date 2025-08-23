const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addDefaultData() {
  console.log('📊 Adding default data to StayCool CRM...\n')
  
  try {
    // Add default admin user
    console.log('👤 Creating admin user...')
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .upsert({
        id: 'admin_001',
        email: 'admin@staycoolairco.nl',
        name: 'StayCool Admin',
        role: 'ADMIN',
        phone: '+31 20 123 4567'
      })
      .select()
      .single()
    
    if (adminError) {
      console.log(`   ⚠️  ${adminError.message}`)
    } else {
      console.log('   ✅ Admin user created/updated')
    }
    
    // Add default company
    console.log('🏢 Creating StayCool company...')
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: 'company_staycool',
        name: 'StayCool Air Conditioning',
        website: 'https://staycoolairco.nl',
        industry: 'HVAC Services',
        size: 'MEDIUM',
        address: 'Hoofdstraat 123',
        city: 'Amsterdam',
        postalCode: '1000 AB',
        country: 'Netherlands',
        description: 'Professional air conditioning installation and maintenance services',
        vatNumber: 'NL123456789B01'
      })
      .select()
      .single()
    
    if (companyError) {
      console.log(`   ⚠️  ${companyError.message}`)
    } else {
      console.log('   ✅ StayCool company created/updated')
    }
    
    // Add a test contact for the existing lead
    console.log('👥 Creating test contact...')
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert({
        id: 'contact_001',
        firstName: 'Jan',
        lastName: 'Janssen',
        email: 'jan@bakkerijjanssen.nl',
        phone: '+31 6 1234 5678',
        jobTitle: 'Eigenaar',
        companyId: 'company_staycool',
        address: 'Hoofdstraat 123',
        city: 'Amsterdam',
        postalCode: '1234 AB',
        country: 'Netherlands',
        createdById: 'admin_001'
      })
      .select()
      .single()
    
    if (contactError) {
      console.log(`   ⚠️  ${contactError.message}`)
    } else {
      console.log('   ✅ Test contact created/updated')
    }
    
    console.log('\n🎉 Default data setup completed!')
    console.log('\n📋 Summary:')
    console.log('   👤 Admin user: admin@staycoolairco.nl')
    console.log('   🏢 Company: StayCool Air Conditioning')
    console.log('   👥 Test contact: Jan Janssen')
    console.log('\n🚀 Your CRM is ready to use!')
    
  } catch (error) {
    console.error('❌ Failed to add default data:', error.message)
  }
}

addDefaultData()