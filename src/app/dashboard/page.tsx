import { createClient } from '@/lib/supabase/server'
import LeadPipeline from '@/components/leads/LeadPipeline'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's first tenant (for MVP)
  const { data: userTenants } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!userTenants) return null

  // Get pipeline stages
  const { data: stages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')

  // Get leads for this tenant
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', userTenants.tenant_id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sleep leads tussen kolommen om hun status te wijzigen
          </p>
        </div>

        <LeadPipeline 
          stages={stages || []} 
          initialLeads={leads || []} 
          tenantId={userTenants.tenant_id}
        />
      </div>
    </div>
  )
}