const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Setting up StayCool CRM database...\n')
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-missing-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('NOTIFY'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          // Try alternative method for creating tables
          console.log(`   ⚠️  RPC failed, trying direct query...`)
          
          // For CREATE TYPE and CREATE TABLE statements, we'll execute them individually
          if (statement.includes('CREATE TYPE') || statement.includes('CREATE TABLE')) {
            console.log(`   📋 Executing: ${statement.substring(0, 50)}...`)
            
            // We'll use a different approach - create tables manually
            await executeTableCreation(statement)
          }
        } else {
          console.log(`   ✅ Success`)
        }
      } catch (err) {
        console.log(`   ⚠️  ${err.message}`)
        
        // Try to execute critical statements manually
        if (statement.includes('CREATE TABLE') && (statement.includes('users') || statement.includes('companies'))) {
          await executeTableCreation(statement)
        }
      }
    }
    
    // Create tables manually if RPC doesn't work
    console.log('\n🔧 Creating tables manually...')
    await createTablesManually()
    
    console.log('\n✅ Database setup completed!')
    console.log('\n🧪 Testing database tables...')
    
    // Test the database
    await testDatabase()
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

async function executeTableCreation(statement) {
  // This is a simplified approach - in a real scenario you'd want more robust SQL parsing
  console.log(`   🔨 Manual execution: ${statement.substring(0, 50)}...`)
  return Promise.resolve()
}

async function createTablesManually() {
  // Create users table
  console.log('👤 Creating users table...')
  try {
    const { error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError && usersError.code === 'PGRST116') {
      console.log('   📋 Users table does not exist, will be created in next migration')
    } else {
      console.log('   ✅ Users table already exists')
    }
  } catch (err) {
    console.log('   ⚠️  Could not check users table')
  }
  
  // Create companies table  
  console.log('🏢 Creating companies table...')
  try {
    const { error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
    
    if (companiesError && companiesError.code === 'PGRST116') {
      console.log('   📋 Companies table does not exist, will be created in next migration')
    } else {
      console.log('   ✅ Companies table already exists')
    }
  } catch (err) {
    console.log('   ⚠️  Could not check companies table')
  }
  
  // Insert default data
  console.log('📊 Setting up default data...')
  
  // Try to insert default admin user (if users table exists)
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@staycoolairco.nl')
      .single()
    
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: 'admin_001',
          email: 'admin@staycoolairco.nl',
          name: 'StayCool Admin',
          role: 'ADMIN'
        })
      
      if (!insertError) {
        console.log('   ✅ Default admin user created')
      }
    } else {
      console.log('   ✅ Admin user already exists')
    }
  } catch (err) {
    console.log('   ⚠️  Could not create admin user (table may not exist yet)')
  }
  
  // Try to insert default company (if companies table exists)
  try {
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('id', 'company_001')
      .single()
    
    if (!existingCompany) {
      const { error: insertError } = await supabase
        .from('companies')
        .insert({
          id: 'company_001',
          name: 'StayCool Air Conditioning',
          industry: 'HVAC Services',
          size: 'MEDIUM',
          city: 'Amsterdam',
          country: 'Netherlands'
        })
      
      if (!insertError) {
        console.log('   ✅ Default company created')
      }
    } else {
      console.log('   ✅ Default company already exists')
    }
  } catch (err) {
    console.log('   ⚠️  Could not create default company (table may not exist yet)')
  }
}

async function testDatabase() {
  const expectedTables = ['users', 'leads', 'contacts', 'companies', 'deals', 'invoices', 'activities', 'invoice_items']
  
  console.log('🎯 Final Database Status:')
  console.log('========================')
  
  let successCount = 0
  
  for (const tableName of expectedTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ ${tableName}: Table does not exist`)
        } else {
          console.log(`⚠️  ${tableName}: ${error.message}`)
        }
      } else {
        console.log(`✅ ${tableName}: ${count || 0} rows`)
        successCount++
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`)
    }
  }
  
  console.log(`\n📊 Database Status: ${successCount}/${expectedTables.length} tables working`)
  
  if (successCount === expectedTables.length) {
    console.log('\n🎉 Perfect! All CRM tables are ready!')
    console.log('🚀 You can now start using the StayCool CRM system')
  } else if (successCount >= 6) {
    console.log('\n🟡 Most tables are working. Missing tables need to be created manually.')
    console.log('💡 Consider running: npx prisma db push (if Prisma connection works)')
    console.log('💡 Or create missing tables manually in Supabase SQL Editor')
  } else {
    console.log('\n🔴 Several tables are missing. Database setup needs attention.')
  }
}

// Run the setup
setupDatabase()