import { createClient } from '@/lib/supabase/server'
import LeadPipeline from '@/components/leads/LeadPipeline'
import RealtimeStatus from '@/components/ui/RealtimeStatus'

// Helper functions to map database stages
function getStageDisplayName(key: string): string {
  const names: Record<string, string> = {
    'new': 'Nieuw',
    'contacted': 'Gecontacteerd',
    'qualified': 'Gekwalificeerd',
    'proposal': 'Offerte',
    'won': 'Gewonnen',
    'lost': 'Verloren',
    'converted': 'Geconverteerd'
  }
  return names[key] || key
}

function getStageColor(key: string): string {
  const colors: Record<string, string> = {
    'new': 'bg-blue-500',
    'contacted': 'bg-yellow-500',
    'qualified': 'bg-purple-500',
    'proposal': 'bg-indigo-500',
    'won': 'bg-green-500',
    'lost': 'bg-red-500',
    'converted': 'bg-green-500'
  }
  return colors[key] || 'bg-gray-500'
}

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

  // Get pipeline stages from database
  const { data: dbStages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .order('sort_order')
  
  // Map database stages to the format LeadPipeline expects
  const stages = dbStages?.map(stage => ({
    id: stage.id,
    key: stage.key,
    sort_order: stage.sort_order
  })) as any[]

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

  const { count: wonLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', userTenants.tenant_id)
    .eq('status', 'won')

  // Get recent leads for activity feed
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', userTenants.tenant_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Define default stages if none exist
  const defaultStages = [
    { id: 1, key: 'new', sort_order: 1 },
    { id: 2, key: 'contacted', sort_order: 2 },
    { id: 3, key: 'qualified', sort_order: 3 },
    { id: 4, key: 'proposal', sort_order: 4 },
    { id: 5, key: 'won', sort_order: 5 },
    { id: 6, key: 'lost', sort_order: 6 }
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

          {/* Won Leads */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Gewonnen Deals
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {wonLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Pipeline - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Kanban Pipeline</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Sleep leads tussen kolommen om hun status te wijzigen (drag & drop)
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                    Drag & Drop Enabled
                  </div>
                </div>
              </div>

              <LeadPipeline 
                stages={stages || defaultStages} 
                initialLeads={leads || []} 
                tenantId={userTenants.tenant_id}
              />
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h3>
              <div className="space-y-3">
                <a
                  href="/dashboard/leads"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Beheer Leads</span>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/dashboard/automations"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-purple-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Automatiseringen</span>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Instellingen</span>
                  </div>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Activiteit</h3>
              <div className="space-y-4">
                {recentLeads && recentLeads.length > 0 ? (
                  recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-2 ${getStageColor(lead.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getStageDisplayName(lead.status)} • {new Date(lead.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nog geen leads toegevoegd</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}