import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    // Get current period (last 30 days) and previous period for comparison
    const currentDate = new Date()
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get leads statistics - SECURED: Filter by tenant
    const { data: currentLeads, error: leadsError } = await supabase
      .from('leads')
      .select('status, value, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString())
    
    const { data: previousLeads } = await supabase
      .from('leads')
      .select('status, value, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch leads data' }, { status: 500 })
    }

    // Get contacts statistics - SECURED: Filter by tenant
    const { data: currentContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString())
    
    const { data: previousContacts } = await supabase
      .from('contacts')
      .select('status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
      return NextResponse.json({ error: 'Failed to fetch contacts data' }, { status: 500 })
    }

    // Calculate metrics
    const currentLeadsCount = currentLeads?.length || 0
    const previousLeadsCount = previousLeads?.length || 0
    const currentContactsCount = currentContacts?.length || 0
    const previousContactsCount = previousContacts?.length || 0

    // Calculate revenue from won leads
    const currentRevenue = currentLeads?.filter((lead: any) => lead.status === 'won')
      .reduce((sum: number, lead: any) => sum + (lead.value || 0), 0) || 0
    const previousRevenue = previousLeads?.filter((lead: any) => lead.status === 'won')
      .reduce((sum: number, lead: any) => sum + (lead.value || 0), 0) || 0

    // Calculate conversion rate
    const currentWonLeads = currentLeads?.filter((lead: any) => lead.status === 'won').length || 0
    const currentConversionRate = currentLeadsCount > 0 ? (currentWonLeads / currentLeadsCount) * 100 : 0
    const previousWonLeads = previousLeads?.filter((lead: any) => lead.status === 'won').length || 0
    const previousConversionRate = previousLeadsCount > 0 ? (previousWonLeads / previousLeadsCount) * 100 : 0

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const analytics = {
      totalLeads: {
        current: currentLeadsCount,
        change: calculateChange(currentLeadsCount, previousLeadsCount)
      },
      totalContacts: {
        current: currentContactsCount,
        change: calculateChange(currentContactsCount, previousContactsCount)
      },
      revenue: {
        current: currentRevenue,
        change: calculateChange(currentRevenue, previousRevenue)
      },
      conversionRate: {
        current: Number(currentConversionRate.toFixed(1)),
        change: calculateChange(currentConversionRate, previousConversionRate)
      },
      // Lead status breakdown for current period
      leadsByStatus: {
        new: currentLeads?.filter((lead: any) => lead.status === 'new').length || 0,
        contacted: currentLeads?.filter((lead: any) => lead.status === 'contacted').length || 0,
        qualified: currentLeads?.filter((lead: any) => lead.status === 'qualified').length || 0,
        proposal: currentLeads?.filter((lead: any) => lead.status === 'proposal').length || 0,
        won: currentLeads?.filter((lead: any) => lead.status === 'won').length || 0,
        lost: currentLeads?.filter((lead: any) => lead.status === 'lost').length || 0,
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error in analytics overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}