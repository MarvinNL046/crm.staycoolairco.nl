import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Activity, Database, TrendingUp, AlertCircle } from 'lucide-react'

export default async function SuperAdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component
          }
        },
      },
    }
  )

  // Get platform statistics
  const [
    { count: totalTenants },
    { count: totalUsers },
    { count: totalLeads },
    { data: recentTenants },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase
      .from('tenants')
      .select('id, name, domain, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Get tenants created in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: newTenantsCount } = await supabase
    .from('tenants')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  const stats = [
    {
      title: 'Totaal Tenants',
      value: totalTenants || 0,
      icon: Building2,
      description: `${newTenantsCount || 0} nieuwe in laatste 30 dagen`,
      color: 'bg-blue-500',
    },
    {
      title: 'Totaal Gebruikers',
      value: totalUsers || 0,
      icon: Users,
      description: 'Actieve gebruikers platform-breed',
      color: 'bg-green-500',
    },
    {
      title: 'Totaal Leads',
      value: totalLeads || 0,
      icon: TrendingUp,
      description: 'Alle leads in het systeem',
      color: 'bg-purple-500',
    },
    {
      title: 'Systeem Status',
      value: 'Actief',
      icon: Activity,
      description: 'Alle services operationeel',
      color: 'bg-emerald-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600">Platform overzicht en beheer</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString('nl-NL') : stat.value}
                </div>
                <p className="text-sm text-gray-600">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Recente Tenants
            </CardTitle>
            <CardDescription>
              Nieuw geregistreerde bedrijven
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTenants && recentTenants.length > 0 ? (
                recentTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-sm text-gray-600">{tenant.domain}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Geen recente tenants</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Systeem Gezondheid
            </CardTitle>
            <CardDescription>
              Platform status en prestaties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Database</span>
                </div>
                <span className="text-sm text-green-600">Operationeel</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">API Services</span>
                </div>
                <span className="text-sm text-green-600">Operationeel</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Authentication</span>
                </div>
                <span className="text-sm text-green-600">Operationeel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snelle Acties</CardTitle>
          <CardDescription>
            Vaak gebruikte beheertaken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building2 className="h-8 w-8 text-blue-500 mb-2" />
              <span className="font-medium">Nieuwe Tenant</span>
              <span className="text-sm text-gray-600">Bedrijf toevoegen</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-green-500 mb-2" />
              <span className="font-medium">Gebruikers Beheren</span>
              <span className="text-sm text-gray-600">Accounts beheren</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Database className="h-8 w-8 text-purple-500 mb-2" />
              <span className="font-medium">Database Status</span>
              <span className="text-sm text-gray-600">Prestaties bekijken</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}