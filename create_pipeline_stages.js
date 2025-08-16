const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPipelineStages() {
  console.log('Creating pipeline stages...\n')
  
  // First check if table has any data
  const { data: existing, error: checkError } = await supabase
    .from('pipeline_stages')
    .select('*')
  
  if (checkError) {
    if (checkError.message.includes('relation') || checkError.message.includes('does not exist')) {
      console.error('❌ Table pipeline_stages does not exist!')
      console.log('\nPlease run this SQL in Supabase first:')
      console.log(`
CREATE TABLE pipeline_stages (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL
);
      `)
      return
    } else {
      console.error('Error checking table:', checkError)
      return
    }
  }
  
  if (existing && existing.length > 0) {
    console.log(`Table already has ${existing.length} stages:`)
    existing.forEach(stage => {
      console.log(`  - ${stage.key} (order: ${stage.sort_order})`)
    })
    console.log('\nClearing existing stages...')
    
    // Delete existing stages
    const { error: deleteError } = await supabase
      .from('pipeline_stages')
      .delete()
      .gte('id', 0)
    
    if (deleteError) {
      console.error('Error deleting stages:', deleteError)
      return
    }
  }
  
  // Insert stages one by one
  const stages = [
    { key: 'new', sort_order: 1 },
    { key: 'contacted', sort_order: 2 },
    { key: 'qualified', sort_order: 3 },
    { key: 'proposal', sort_order: 4 },
    { key: 'won', sort_order: 5 },
    { key: 'lost', sort_order: 6 }
  ]
  
  for (const stage of stages) {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert(stage)
      .select()
    
    if (error) {
      console.error(`❌ Error inserting ${stage.key}:`, error.message)
    } else {
      console.log(`✅ Created stage: ${stage.key}`)
    }
  }
  
  // Verify final result
  const { data: finalStages, error: finalError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')
  
  if (!finalError && finalStages) {
    console.log('\n✨ Pipeline stages created successfully!')
    console.log('Stages in order:')
    finalStages.forEach(stage => {
      console.log(`  ${stage.sort_order}. ${stage.key}`)
    })
  }
}

createPipelineStages()
  .then(() => {
    console.log('\n🎉 Done! Refresh your browser to see the Kanban columns.')
  })
  .catch(err => {
    console.error('Unexpected error:', err)
  })