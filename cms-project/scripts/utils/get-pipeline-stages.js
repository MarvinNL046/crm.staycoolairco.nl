const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bdrbfgqgktiuvmynksbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcmJmZ3Fna3RpdXZteW5rc2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM1NDU0OSwiZXhwIjoyMDcwOTMwNTQ5fQ.fA0gJUpspPNTNhk8mhmmXvNg0IFTroKzr_ya0E7lYlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getPipelineStages() {
  console.log('🔄 PIPELINE STAGES CONFIGURATION\n');
  
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log('📊 Sales Pipeline Stages:');
  console.log('═'.repeat(40));
  data.forEach((stage, index) => {
    console.log(`${index + 1}. ${stage.key.toUpperCase()} (Order: ${stage.sort_order})`);
  });
}

getPipelineStages().catch(console.error);