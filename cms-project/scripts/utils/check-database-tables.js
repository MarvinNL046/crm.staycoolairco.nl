const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseTables() {
  console.log('🔍 Checking Supabase database tables...\n')
  console.log('📡 Supabase URL:', supabaseUrl)
  console.log('🔑 Service Key:', supabaseServiceKey ? '✅ Provided' : '❌ Missing')
  console.log('')
  
  try {
    // Try a simple query to test connection
    const { data: testQuery, error: testError } = await supabase
      .rpc('version')

    if (testError) {
      console.log('⚠️  RPC test failed, trying alternative method...')
      
      // Try to query a system table
      const { data: pgTables, error: pgError } = await supabase
        .rpc('exec', { 
          query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;` 
        })

      if (pgError) {
        console.error('❌ Cannot query database:', pgError.message)
        
        // Try basic table check
        console.log('\n🔍 Trying basic table checks...')
        
        const expectedTables = ['users', 'leads', 'contacts', 'companies', 'deals', 'invoices', 'activities', 'invoice_items']
        
        for (const tableName of expectedTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
            
            if (error) {
              console.log(`❌ ${tableName}: ${error.message}`)
            } else {
              console.log(`✅ ${tableName}: Table exists`)
              
              // Try to get count
              const { count, error: countError } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true })
              
              if (!countError) {
                console.log(`   📊 Rows: ${count || 0}`)
              }
            }
          } catch (err) {
            console.log(`❌ ${tableName}: ${err.message}`)
          }
        }
        return
      }
    }

    console.log('✅ Successfully connected to Supabase\n')

    // Check expected CRM tables
    const expectedTables = ['users', 'leads', 'contacts', 'companies', 'deals', 'invoices', 'activities', 'invoice_items']
    console.log('🎯 CRM Tables Status:')
    console.log('====================')
    
    for (const tableName of expectedTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log(`❌ ${tableName}: Table does not exist`)
          } else {
            console.log(`⚠️  ${tableName}: ${error.message}`)
          }
        } else {
          console.log(`✅ ${tableName}: ${count || 0} rows`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }

    console.log('\n💡 Next Steps:')
    console.log('==============')
    
    // Check if any tables exist
    let tablesExist = false
    for (const tableName of expectedTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error) {
          tablesExist = true
          break
        }
      } catch (err) {
        // Continue checking
      }
    }
    
    if (!tablesExist) {
      console.log('📥 No CRM tables found. You need to:')
      console.log('   1. Update your DATABASE_URL to point to Supabase')
      console.log('   2. Run: npx prisma db push')
      console.log('   3. Or run: npx prisma migrate dev')
      console.log('')
      console.log('🔧 Update your .env.local file:')
      console.log(`   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.bdrbfgqgktiuvmynksbe.supabase.co:5432/postgres"`)
    } else {
      console.log('✅ Some tables exist. Check for missing tables and run migrations if needed.')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Check your Supabase project is active')
    console.log('   2. Verify your SUPABASE_SERVICE_ROLE_KEY')
    console.log('   3. Make sure your Supabase project has the correct permissions')
  }
}

checkDatabaseTables()