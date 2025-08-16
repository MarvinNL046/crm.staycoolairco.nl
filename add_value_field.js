const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addValueField() {
  try {
    console.log('Adding value field to leads table...')
    
    // First, let's check if the field already exists
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'leads' })
    
    if (columnsError) {
      // If the function doesn't exist, we'll just try to add the column
      console.log('Could not check existing columns, proceeding with migration...')
    } else {
      const hasValueColumn = columns?.some(col => col.column_name === 'value')
      if (hasValueColumn) {
        console.log('Value column already exists!')
        return
      }
    }
    
    // Execute the SQL to add the value column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add value field to leads table
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS value DECIMAL(10,2) DEFAULT 0;
        
        -- Add some example values to existing leads
        UPDATE leads SET value = 
          CASE 
            WHEN status = 'new' THEN 500 + (RANDOM() * 1000)
            WHEN status = 'contacted' THEN 1000 + (RANDOM() * 2000)
            WHEN status = 'qualified' THEN 2000 + (RANDOM() * 3000)
            WHEN status = 'proposal' THEN 3000 + (RANDOM() * 5000)
            WHEN status = 'won' THEN 5000 + (RANDOM() * 10000)
            ELSE 0
          END
        WHERE value IS NULL OR value = 0;
      `
    })
    
    if (alterError) {
      // Try a simpler approach - just check if we can query with value field
      const { data: testQuery, error: testError } = await supabase
        .from('leads')
        .select('id, value')
        .limit(1)
      
      if (!testError) {
        console.log('Value field already exists and is accessible!')
        return
      }
      
      console.error('Error adding value field:', alterError)
      throw alterError
    }
    
    console.log('Successfully added value field to leads table!')
    
    // Verify the field was added
    const { data: leads, error: verifyError } = await supabase
      .from('leads')
      .select('id, name, value, status')
      .limit(5)
    
    if (!verifyError && leads) {
      console.log('\nSample leads with values:')
      leads.forEach(lead => {
        console.log(`- ${lead.name}: €${lead.value?.toFixed(2) || '0.00'} (${lead.status})`)
      })
    }
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
addValueField()