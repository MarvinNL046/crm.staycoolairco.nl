import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET all subscriptions overview
export async function GET(request: NextRequest) {
  try {
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

    // Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!superAdmin) {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
    }

    // Get all tenants with subscription data and user count
    const { data: tenants, error } = await supabase
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

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

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

    return NextResponse.json({
      tenants,
      stats,
    })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}