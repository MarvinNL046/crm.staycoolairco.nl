import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Users, TrendingUp, Calendar, ExternalLink, Settings } from 'lucide-react'

export default async function TenantsPage() {
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

  // Get all tenants with their statistics
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  // Get statistics for each tenant
  const tenantsWithStats = await Promise.all(
    (tenants || []).map(async (tenant) => {
      const [
        { count: userCount },
        { count: leadsCount },
        { count: contactsCount },
        { count: dealsCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        supabase.from('deals').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      ])

      return {
        ...tenant,
        stats: {
          users: userCount || 0,
          leads: leadsCount || 0,
          contacts: contactsCount || 0,
          deals: dealsCount || 0,
        }
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Beheer</h1>
          <p className="text-gray-600">Bekijk en beheer alle geregistreerde bedrijven</p>
        </div>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Nieuwe Tenant
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{tenantsWithStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Gebruikers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenantsWithStats.reduce((acc, tenant) => acc + tenant.stats.users, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenantsWithStats.reduce((acc, tenant) => acc + tenant.stats.leads, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Deze Maand</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenantsWithStats.filter(tenant => {
                    const created = new Date(tenant.created_at)
                    const now = new Date()
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tenantsWithStats.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    {tenant.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <ExternalLink className="h-3 w-3" />
                    {tenant.domain}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Actief
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{tenant.stats.users}</p>
                    <p className="text-sm text-gray-600">Gebruikers</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{tenant.stats.leads}</p>
                    <p className="text-sm text-gray-600">Leads</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{tenant.stats.contacts}</p>
                    <p className="text-sm text-gray-600">Contacten</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{tenant.stats.deals}</p>
                    <p className="text-sm text-gray-600">Deals</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-100 text-sm text-gray-600">
                  <p>Aangemaakt: {new Date(tenant.created_at).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p className="mt-1">ID: {tenant.id.slice(0, 8)}...</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="mr-2 h-3 w-3" />
                    Beheren
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`https://${tenant.domain}`} target="_blank">
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tenantsWithStats.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Geen tenants gevonden</h3>
            <p className="mt-2 text-gray-600">Er zijn nog geen bedrijven geregistreerd in het systeem.</p>
            <Button className="mt-4">
              <Building2 className="mr-2 h-4 w-4" />
              Eerste Tenant Toevoegen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}