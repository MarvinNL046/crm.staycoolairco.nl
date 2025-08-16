import { createClient } from '@/lib/supabase/server'
import LeadPipeline from '@/components/leads/LeadPipeline'
import RealtimeStatus from '@/components/ui/RealtimeStatus'

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

  // Get pipeline stages - commented out for now as table doesn't exist
  // const { data: stages } = await supabase
  //   .from('pipeline_stages')
  //   .select('*')
  //   .order('sort_order')
  const stages = null // We'll use defaultStages instead

  // Get leads for this tenant
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', userTenants.tenant_id)
    .order('created_at', { ascending: false })

  // Get tenant info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', userTenants.tenant_id)
    .single()

  // Get some stats
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', userTenants.tenant_id)

  const { count: newLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', userTenants.tenant_id)
    .eq('status', 'new')

  const { count: qualifiedLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', userTenants.tenant_id)
    .eq('status', 'qualified')

  // Define default stages if none exist
  const defaultStages = [
    { id: '1', name: 'Nieuw', status: 'new', color: 'bg-blue-500', sort_order: 1 },
    { id: '2', name: 'Gecontacteerd', status: 'contacted', color: 'bg-yellow-500', sort_order: 2 },
    { id: '3', name: 'Gekwalificeerd', status: 'qualified', color: 'bg-purple-500', sort_order: 3 },
    { id: '4', name: 'Geconverteerd', status: 'converted', color: 'bg-green-500', sort_order: 4 },
    { id: '5', name: 'Verloren', status: 'lost', color: 'bg-red-500', sort_order: 5 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welkom bij {tenant?.name || 'StayCool CRM'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Beheer je leads en groei je airco business
                </p>
              </div>
              <RealtimeStatus tenantId={userTenants.tenant_id} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Leads */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Totaal Leads
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {totalLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* New Leads */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Nieuwe Leads
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {newLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Qualified Leads */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Gekwalificeerd
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {qualifiedLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Quick Actions
                    </dt>
                    <dd>
                      <a href="/dashboard/leads" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                        Beheer Leads →
                      </a>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Lead Pipeline</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sleep leads tussen kolommen om hun status te wijzigen
            </p>
          </div>

          <LeadPipeline 
            stages={stages || defaultStages} 
            initialLeads={leads || []} 
            tenantId={userTenants.tenant_id}
          />
        </div>
      </div>
    </div>
  )
}