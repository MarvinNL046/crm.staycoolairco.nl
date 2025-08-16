const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndUpdateLeads() {
  try {
    console.log('Checking if value field exists...')
    
    // Try to query the value field
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, value, status, source')
      .limit(5)
    
    if (error && error.message.includes('value')) {
      console.log('Value field does not exist. Please add it manually in Supabase:')
      console.log('ALTER TABLE leads ADD COLUMN value DECIMAL(10,2) DEFAULT 0;')
      return
    }
    
    if (leads) {
      console.log('Value field exists! Current leads:')
      leads.forEach(lead => {
        console.log(`- ${lead.name}: €${lead.value || '0.00'} (${lead.status}) - Source: ${lead.source || 'N/A'}`)
      })
      
      // Update leads without values
      const leadsWithoutValues = leads.filter(lead => !lead.value || lead.value === 0)
      
      if (leadsWithoutValues.length > 0) {
        console.log('\nUpdating leads without values...')
        
        for (const lead of leadsWithoutValues) {
          let value = 0
          switch (lead.status) {
            case 'new': value = 500 + Math.random() * 1000; break;
            case 'contacted': value = 1000 + Math.random() * 2000; break;
            case 'qualified': value = 2000 + Math.random() * 3000; break;
            case 'proposal': value = 3000 + Math.random() * 5000; break;
            case 'won': value = 5000 + Math.random() * 10000; break;
            default: value = 250 + Math.random() * 500;
          }
          
          const { error: updateError } = await supabase
            .from('leads')
            .update({ value: Math.round(value * 100) / 100 })
            .eq('id', lead.id)
          
          if (updateError) {
            console.error(`Error updating lead ${lead.name}:`, updateError)
          } else {
            console.log(`Updated ${lead.name} with value €${value.toFixed(2)}`)
          }
        }
      }
      
      // Update source field for leads without it
      const leadsWithoutSource = leads.filter(lead => !lead.source)
      if (leadsWithoutSource.length > 0) {
        console.log('\nUpdating leads without source...')
        const sources = ['Website', 'Facebook', 'Google Ads', 'Instagram', 'Referral', 'Walk-in']
        
        for (const lead of leadsWithoutSource) {
          const randomSource = sources[Math.floor(Math.random() * sources.length)]
          
          const { error: updateError } = await supabase
            .from('leads')
            .update({ source: randomSource })
            .eq('id', lead.id)
          
          if (!updateError) {
            console.log(`Updated ${lead.name} with source: ${randomSource}`)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the check
checkAndUpdateLeads()