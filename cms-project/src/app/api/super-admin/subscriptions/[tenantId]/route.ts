import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
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

    // Parse request body
    const body = await request.json()
    const {
      subscription_plan,
      subscription_status,
      monthly_price,
      max_users,
      max_leads,
      subscription_ends_at,
    } = body

    // Validate required fields
    if (!subscription_plan || !subscription_status) {
      return NextResponse.json(
        { error: 'Missing required fields: subscription_plan, subscription_status' },
        { status: 400 }
      )
    }

    // Update tenant subscription
    const { data: updatedTenant, error } = await supabase
      .from('tenants')
      .update({
        subscription_plan,
        subscription_status,
        monthly_price: parseFloat(monthly_price) || 0,
        max_users: parseInt(max_users) || 1,
        max_leads: parseInt(max_leads) || 100,
        subscription_ends_at: subscription_ends_at || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (await params).tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tenant subscription:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    // Log the subscription change
    await supabase.from('system_audit_log').insert({
      actor_id: user.id,
      action: 'subscription_updated',
      resource_type: 'tenant',
      resource_id: (await params).tenantId,
      details: {
        old_plan: body.old_plan,
        new_plan: subscription_plan,
        changed_by: user.email,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
      message: 'Subscription updated successfully',
    })

  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
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

    // Get tenant subscription details
    const { data: tenant, error } = await supabase
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
        created_at
      `)
      .eq('id', (await params).tenantId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tenant })

  } catch (error) {
    console.error('Error fetching tenant subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}