const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupPipelineStages() {
  console.log('Setting up pipeline stages...')
  
  // Insert default stages
  const stages = [
    { key: 'new', sort_order: 1 },
    { key: 'contacted', sort_order: 2 },
    { key: 'qualified', sort_order: 3 },
    { key: 'proposal', sort_order: 4 },
    { key: 'won', sort_order: 5 },
    { key: 'lost', sort_order: 6 }
  ]
  
  for (const stage of stages) {
    const { error } = await supabase
      .from('pipeline_stages')
      .upsert(stage, { onConflict: 'key' })
    
    if (error) {
      console.error(`Error inserting stage ${stage.key}:`, error)
    } else {
      console.log(`✓ Stage ${stage.key} inserted`)
    }
  }
  
  // Verify stages
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching stages:', error)
  } else {
    console.log('\nPipeline stages in database:')
    data.forEach(stage => {
      console.log(`  ${stage.sort_order}. ${stage.key} (id: ${stage.id})`)
    })
  }
}

setupPipelineStages().catch(console.error)