import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { SubscriptionsClient } from './subscriptions-client'
import { TrendingUp, CreditCard } from 'lucide-react'

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

  // Get all tenants with subscription information and statistics
  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      domain,
      subscription_plan,
      subscription_status,
      monthly_price,
      max_users,
      max_leads,
      subscription_started_at,
      subscription_ends_at,
      created_at,
      profiles(count)
    `)
    .order('subscription_ends_at', { ascending: true })

  // Calculate statistics
  const stats = {
    total_revenue: tenants?.reduce((sum, t) => sum + (parseFloat(t.monthly_price) || 0), 0) || 0,
    active_subscriptions: tenants?.filter(t => t.subscription_status === 'active').length || 0,
    total_tenants: tenants?.length || 0,
    expiring_soon: tenants?.filter(t => {
      if (!t.subscription_ends_at) return false
      const endDate = new Date(t.subscription_ends_at)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length || 0,
    plan_distribution: {
      free: tenants?.filter(t => t.subscription_plan === 'free').length || 0,
      starter: tenants?.filter(t => t.subscription_plan === 'starter').length || 0,
      professional: tenants?.filter(t => t.subscription_plan === 'professional').length || 0,
      enterprise: tenants?.filter(t => t.subscription_plan === 'enterprise').length || 0,
    }
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

      {/* Client Component */}
      <SubscriptionsClient 
        initialTenants={tenants || []} 
        initialStats={stats}
      />
    </div>
  )
}