import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2
} from 'lucide-react'

export default async function SubscriptionsPage() {
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

  // Get all tenants with subscription information
  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      *,
      profiles(count)
    `)
    .order('subscription_ends_at', { ascending: true })

  // Calculate subscription statistics
  const totalRevenue = tenants?.reduce((sum, tenant) => sum + (parseFloat(tenant.monthly_price) || 0), 0) || 0
  const activeSubs = tenants?.filter(t => t.subscription_status === 'active').length || 0
  const expiringSoon = tenants?.filter(t => {
    if (!t.subscription_ends_at) return false
    const endDate = new Date(t.subscription_ends_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }).length || 0

  const subscriptionPlans = [
    { name: 'Free', price: 0, maxUsers: 1, maxLeads: 100, color: 'gray' },
    { name: 'Starter', price: 19.99, maxUsers: 3, maxLeads: 500, color: 'blue' },
    { name: 'Professional', price: 49.99, maxUsers: 10, maxLeads: 2000, color: 'green' },
    { name: 'Enterprise', price: 99.99, maxUsers: 50, maxLeads: 10000, color: 'purple' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'trial': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'trial': return <Clock className="h-4 w-4 text-blue-600" />
      case 'expired': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-600" />
      case 'suspended': return <AlertCircle className="h-4 w-4 text-orange-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'starter': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'professional': return 'bg-green-100 text-green-800 border-green-200'
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getDaysUntilExpiry = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Beheer</h1>
          <p className="text-gray-600">Beheer abonnementen en facturatie van alle tenants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Revenue Report
          </Button>
          <Button>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing Settings
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Maandelijkse Omzet
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-sm text-gray-600">Actieve abonnementen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Actieve Abonnementen
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeSubs}</div>
            <p className="text-sm text-gray-600">Van {tenants?.length || 0} totaal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Verlopen Binnenkort
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{expiringSoon}</div>
            <p className="text-sm text-gray-600">Binnen 30 dagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gemiddelde Waarde
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalRevenue / (activeSubs || 1))}
            </div>
            <p className="text-sm text-gray-600">Per abonnement</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Beschikbare Plannen
          </CardTitle>
          <CardDescription>
            Overzicht van alle subscription plannen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {subscriptionPlans.map((plan) => (
              <div key={plan.name} className="border border-gray-200 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-lg text-gray-900">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 my-2">
                  {formatCurrency(plan.price)}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{plan.maxUsers} gebruikers</p>
                  <p>{plan.maxLeads} leads</p>
                </div>
                <div className="mt-3">
                  <Badge className={`${plan.color === 'gray' ? 'bg-gray-100 text-gray-800' : 
                    plan.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    plan.color === 'green' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'}`}>
                    {tenants?.filter(t => t.subscription_plan === plan.name.toLowerCase()).length || 0} klanten
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tenant Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tenant Abonnementen
          </CardTitle>
          <CardDescription>
            Beheer abonnementen van alle tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants && tenants.length > 0 ? (
              tenants.map((tenant) => {
                const daysUntilExpiry = getDaysUntilExpiry(tenant.subscription_ends_at)
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0
                
                return (
                  <div key={tenant.id} className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isExpiringSoon ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{tenant.name}</h4>
                          <Badge className={getPlanColor(tenant.subscription_plan || 'free')}>
                            {tenant.subscription_plan || 'free'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(tenant.subscription_status || 'active')}
                            <Badge className={getStatusColor(tenant.subscription_status || 'active')}>
                              {tenant.subscription_status || 'active'}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Maandprijs:</span>
                            <p className="font-medium">{formatCurrency(parseFloat(tenant.monthly_price) || 0)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Gebruikers:</span>
                            <p className="font-medium">{tenant.profiles?.length || 0} / {tenant.max_users || 1}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Verloopt op:</span>
                            <p className="font-medium">
                              {tenant.subscription_ends_at 
                                ? new Date(tenant.subscription_ends_at).toLocaleDateString('nl-NL')
                                : 'Onbeperkt'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className={`font-medium ${
                              isExpiringSoon ? 'text-orange-600' : 
                              daysUntilExpiry && daysUntilExpiry < 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {daysUntilExpiry === null ? 'Actief' :
                               daysUntilExpiry < 0 ? 'Verlopen' :
                               daysUntilExpiry === 0 ? 'Verloopt vandaag' :
                               `${daysUntilExpiry} dagen resterend`
                              }
                            </p>
                          </div>
                        </div>

                        {isExpiringSoon && (
                          <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-sm text-orange-800">
                            ⚠️ Dit abonnement verloopt binnenkort. Neem contact op met de klant voor verlenging.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          Bewerken
                        </Button>
                        <Button variant="outline" size="sm">
                          Facturen
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Geen abonnementen gevonden</h3>
                <p className="mt-2 text-gray-600">Er zijn nog geen actieve abonnementen.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}