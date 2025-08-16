const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupPipelineStages() {
  console.log('Setting up pipeline stages table...\n')
  
  // First, check if the table exists
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables')
    .catch(() => ({ data: null, error: null }))
  
  // Create table using raw SQL
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL
    );
  `
  
  const { error: createError } = await supabase.rpc('exec_sql', { 
    sql: createTableSQL 
  }).catch(async () => {
    // If RPC doesn't exist, try direct approach
    console.log('Creating table...')
    
    // Let's try to insert data - if table doesn't exist, we'll know
    const testInsert = await supabase
      .from('pipeline_stages')
      .select('count')
      .limit(1)
    
    if (testInsert.error && testInsert.error.message.includes('relation')) {
      console.log('Table does not exist. Please create it manually in Supabase.')
      return { error: testInsert.error }
    }
    
    return { error: null }
  })
  
  if (createError) {
    console.log('Note: Could not create table via RPC. Attempting direct inserts...')
  }
  
  // Insert default stages
  const stages = [
    { key: 'new', sort_order: 1 },
    { key: 'contacted', sort_order: 2 },
    { key: 'qualified', sort_order: 3 },
    { key: 'proposal', sort_order: 4 },
    { key: 'won', sort_order: 5 },
    { key: 'lost', sort_order: 6 }
  ]
  
  console.log('Inserting pipeline stages...')
  
  for (const stage of stages) {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .upsert(stage, { 
        onConflict: 'key',
        ignoreDuplicates: false 
      })
      .select()
    
    if (error) {
      console.error(`Error inserting stage ${stage.key}:`, error.message)
    } else {
      console.log(`✓ Stage '${stage.key}' added successfully`)
    }
  }
  
  // Verify stages
  console.log('\nVerifying pipeline stages...')
  const { data: allStages, error: fetchError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')
  
  if (fetchError) {
    console.error('Error fetching stages:', fetchError)
  } else {
    console.log('\nPipeline stages in database:')
    allStages.forEach(stage => {
      console.log(`  ${stage.sort_order}. ${stage.key} (id: ${stage.id})`)
    })
    console.log(`\n✅ Total stages: ${allStages.length}`)
  }
}

setupPipelineStages()
  .then(() => console.log('\nDone! Refresh your browser to see the Kanban columns.'))
  .catch(console.error)