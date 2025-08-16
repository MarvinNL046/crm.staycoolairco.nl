const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugPipelinePage() {
  console.log('=== DEBUGGING PIPELINE PAGE ===\n')
  
  // 1. Check pipeline_stages
  console.log('1. Checking pipeline_stages table:')
  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')
  
  if (stagesError) {
    console.error('❌ Error fetching stages:', stagesError)
  } else {
    console.log(`✅ Found ${stages.length} stages:`)
    stages.forEach(s => console.log(`   - ${s.key} (id: ${s.id}, order: ${s.sort_order})`))
  }
  
  // 2. Check leads
  console.log('\n2. Checking leads:')
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('id, name, status, tenant_id')
  
  if (leadsError) {
    console.error('❌ Error fetching leads:', leadsError)
  } else {
    console.log(`✅ Found ${leads.length} leads:`)
    leads.forEach(l => console.log(`   - ${l.name} (status: ${l.status}, tenant: ${l.tenant_id})`))
  }
  
  // 3. Check tenants
  console.log('\n3. Checking tenants:')
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name')
  
  if (tenantsError) {
    console.error('❌ Error fetching tenants:', tenantsError)
  } else {
    console.log(`✅ Found ${tenants.length} tenants:`)
    tenants.forEach(t => console.log(`   - ${t.name} (id: ${t.id})`))
  }
  
  // 4. Check tenant_users (for user f32f873f-7f15-4587-a7fa-2e286adbeeda)
  console.log('\n4. Checking your tenant_users record:')
  const { data: tenantUsers, error: tuError } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('user_id', 'f32f873f-7f15-4587-a7fa-2e286adbeeda')
  
  if (tuError) {
    console.error('❌ Error fetching tenant_users:', tuError)
  } else {
    console.log(`✅ Found ${tenantUsers.length} tenant assignments:`)
    tenantUsers.forEach(tu => console.log(`   - Tenant: ${tu.tenant_id}, Role: ${tu.role}`))
  }
  
  // 5. Summary
  console.log('\n=== SUMMARY ===')
  if (stages && stages.length > 0) {
    console.log('✅ Pipeline stages exist')
  } else {
    console.log('❌ No pipeline stages found!')
  }
  
  if (leads && leads.length > 0) {
    console.log('✅ Leads exist')
  } else {
    console.log('❌ No leads found!')
  }
  
  if (tenantUsers && tenantUsers.length > 0 && tenantUsers[0].tenant_id === '80496bff-b559-4b80-9102-3a84afdaa616') {
    console.log('✅ User is correctly linked to tenant')
  } else {
    console.log('❌ User-tenant link issue!')
  }
  
  console.log('\n💡 Try these fixes:')
  console.log('1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)')
  console.log('2. Clear browser cache')
  console.log('3. Open in incognito/private window')
  console.log('4. Check browser console for errors (F12)')
}

debugPipelinePage().catch(console.error)