import { createClient } from '@/lib/supabase/server'
import RealtimeStatus from '@/components/ui/RealtimeStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'
import LeadStatusChart from '@/components/dashboard/LeadStatusChart'

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

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Zojuist'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minuten geleden`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} uur geleden`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dagen geleden`
  
  return date.toLocaleDateString('nl-NL')
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
  const stages = dbStages?.map((stage: any) => ({
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


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welkom bij {tenant?.name || 'StayCool CRM'}
                </h1>
                <p className="mt-1 text-sm text-foreground-secondary">
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
          <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-foreground-secondary truncate">
                      Totaal Leads
                    </dt>
                    <dd className="text-lg font-semibold text-foreground">
                      {totalLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* New Leads */}
          <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-foreground-secondary truncate">
                      Nieuwe Leads
                    </dt>
                    <dd className="text-lg font-semibold text-foreground">
                      {newLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Qualified Leads */}
          <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-foreground-secondary truncate">
                      Gekwalificeerd
                    </dt>
                    <dd className="text-lg font-semibold text-foreground">
                      {qualifiedLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Won Leads */}
          <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-foreground-secondary truncate">
                      Gewonnen Deals
                    </dt>
                    <dd className="text-lg font-semibold text-foreground">
                      {wonLeads || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Status Distribution */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Lead Status Overzicht</CardTitle>
                <CardDescription>Verdeling van leads per status</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                {stages?.map((stage) => {
                  const stageLeads = leads?.filter((lead: any) => lead.status === stage.key) || []
                  const percentage = totalLeads > 0 ? (stageLeads.length / totalLeads) * 100 : 0
                  
                  return (
                    <div key={stage.id} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground-secondary">
                          {getStageDisplayName(stage.key)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {stageLeads.length} leads ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStageColor(stage.key)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Conversie Trechter</CardTitle>
                <CardDescription>Van lead tot klant</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border">
                  <span className="font-medium text-info">Nieuwe Leads</span>
                  <span className="text-2xl font-bold text-info">{newLeads || 0}</span>
                </div>
                <div className="flex justify-center">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border">
                  <span className="font-medium text-warning">Gekwalificeerd</span>
                  <span className="text-2xl font-bold text-warning">{qualifiedLeads || 0}</span>
                </div>
                <div className="flex justify-center">
                  <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border">
                  <span className="font-medium text-success">Gewonnen</span>
                  <span className="text-2xl font-bold text-success">{wonLeads || 0}</span>
                </div>
              </div>
              {totalLeads > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conversie ratio</span>
                    <span className="font-medium text-foreground">
                      {((wonLeads / totalLeads) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              </CardContent>
            </Card>

            {/* Lead Sources */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Lead Bronnen</CardTitle>
                <CardDescription>Waar komen je leads vandaan</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                {['website', 'email', 'phone', 'referral', 'other'].map(source => {
                  const sourceLeads = leads?.filter((lead: any) => lead.source === source) || []
                  const sourceCount = sourceLeads.length
                  
                  const sourceLabels: Record<string, string> = {
                    website: 'Website',
                    email: 'E-mail',
                    phone: 'Telefoon',
                    referral: 'Verwijzing',
                    other: 'Overig'
                  }
                  
                  const sourceIcons: Record<string, string> = {
                    website: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
                    email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                    phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                    referral: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
                    other: 'M4 6h16M4 10h16M4 14h16M4 18h16'
                  }
                  
                  if (sourceCount === 0) return null
                  
                  return (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-muted-foreground mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceIcons[source]} />
                        </svg>
                        <span className="text-sm font-medium text-foreground-secondary">
                          {sourceLabels[source]}
                        </span>
                      </div>
                      <span className="text-sm text-foreground font-semibold">{sourceCount}</span>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Snelle Acties</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-3">
                <a
                  href="/dashboard/leads"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-info mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground-secondary">Beheer Leads</span>
                  </div>
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/dashboard/automations"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-warning mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground-secondary">Automatiseringen</span>
                  </div>
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-background-secondary transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-muted-foreground mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground-secondary">Instellingen</span>
                  </div>
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              </CardContent>
            </Card>

            {/* Recent Activity Timeline */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Recente Activiteit</CardTitle>
                <CardDescription>Laatste 5 leads</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flow-root">
                {recentLeads && recentLeads.length > 0 ? (
                  <ul className="-mb-8">
                    {recentLeads.map((lead: any, idx: number) => (
                      <li key={lead.id}>
                        <div className="relative pb-8">
                          {idx !== recentLeads.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-background ${getStageColor(lead.status)}`}>
                                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {lead.name}
                              </p>
                              <p className="text-sm text-foreground-secondary">
                                {getStageDisplayName(lead.status)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(new Date(lead.created_at))}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Nog geen activiteit</p>
                )}
              </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Prestaties</CardTitle>
                <CardDescription>Performance indicatoren</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gemiddelde doorlooptijd</span>
                    <span className="font-medium text-foreground">-</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win rate</span>
                    <span className="font-medium text-foreground">
                      {totalLeads > 0 ? `${((wonLeads / totalLeads) * 100).toFixed(0)}%` : '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verloren deals</span>
                    <span className="font-medium text-foreground">
                      {leads?.filter((l: any) => l.status === 'lost').length || 0}
                    </span>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}