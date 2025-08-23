import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Shield, UserCheck, Building2, Search, Filter } from 'lucide-react'

export default async function UsersPage() {
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

  // Get all users with their tenant information
  const { data: users } = await supabase
    .from('profiles')
    .select(`
      *,
      tenants(name, domain)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get super admins
  const { data: superAdmins } = await supabase
    .from('super_admins')
    .select('user_id')

  const superAdminIds = new Set(superAdmins?.map(sa => sa.user_id) || [])

  // Get user statistics
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: adminUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).not('last_sign_in_at', 'is', null),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['admin', 'owner']),
  ])

  const stats = [
    {
      title: 'Totaal Gebruikers',
      value: totalUsers || 0,
      icon: Users,
      description: 'Alle geregistreerde gebruikers',
    },
    {
      title: 'Actieve Gebruikers',
      value: activeUsers || 0,
      icon: UserCheck,
      description: 'Gebruikers met recente login',
    },
    {
      title: 'Admin Gebruikers',
      value: adminUsers || 0,
      icon: Shield,
      description: 'Gebruikers met admin rechten',
    },
    {
      title: 'Super Admins',
      value: superAdmins?.length || 0,
      icon: Shield,
      description: 'Platform beheerders',
    },
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gebruikers Beheer</h1>
          <p className="text-gray-600">Beheer alle platform gebruikers en rechten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Zoeken
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-sm text-gray-600">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Platform Gebruikers
          </CardTitle>
          <CardDescription>
            Overzicht van alle geregistreerde gebruikers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(user.full_name || user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {user.full_name || 'Onbekende Naam'}
                        </h4>
                        {superAdminIds.has(user.id) && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            Super Admin
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getRoleBadgeColor(user.role || 'user')}`}>
                          {user.role || 'user'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.tenants?.name || 'Geen tenant'}
                        </span>
                        <span>
                          Aangemeld: {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : 'Onbekend'}
                        </span>
                        {user.last_sign_in_at && (
                          <span>
                            Laatste login: {new Date(user.last_sign_in_at).toLocaleDateString('nl-NL')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={user.last_sign_in_at ? 'default' : 'secondary'}>
                      {user.last_sign_in_at ? 'Actief' : 'Inactief'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Beheren
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Geen gebruikers gevonden</h3>
                <p className="mt-2 text-gray-600">Er zijn nog geen gebruikers geregistreerd in het systeem.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snelle Acties</CardTitle>
          <CardDescription>
            Veelgebruikte gebruikersbeheer taken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Shield className="h-8 w-8 text-blue-500 mb-2" />
              <span className="font-medium">Super Admin Toevoegen</span>
              <span className="text-sm text-gray-600">Nieuwe platform beheerder</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UserCheck className="h-8 w-8 text-green-500 mb-2" />
              <span className="font-medium">Bulk Acties</span>
              <span className="text-sm text-gray-600">Meerdere gebruikers beheren</span>
            </button>
            
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-purple-500 mb-2" />
              <span className="font-medium">Export Gebruikers</span>
              <span className="text-sm text-gray-600">Download gebruikerslijst</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}