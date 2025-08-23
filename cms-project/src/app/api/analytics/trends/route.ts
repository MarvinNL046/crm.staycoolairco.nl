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

    // Get data for the last 12 weeks
    const currentDate = new Date()
    const twelveWeeksAgo = new Date(currentDate.getTime() - 84 * 24 * 60 * 60 * 1000)

    // Get leads data - SECURED: Filter by tenant
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('created_at, status, value')
      .eq('tenant_id', tenantId)
      .gte('created_at', twelveWeeksAgo.toISOString())
      .order('created_at', { ascending: true })

    if (leadsError) {
      console.error('Error fetching leads trends:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 })
    }

    // Get contacts data - SECURED: Filter by tenant
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', twelveWeeksAgo.toISOString())
      .order('created_at', { ascending: true })

    if (contactsError) {
      console.error('Error fetching contacts trends:', contactsError)
      return NextResponse.json({ error: 'Failed to fetch contacts trends data' }, { status: 500 })
    }

    // Group data by week
    const weeklyData: { [key: string]: { leads: number, contacts: number, revenue: number, won: number } } = {}

    // Helper function to get week key (YYYY-WW format)
    const getWeekKey = (date: Date) => {
      const year = date.getFullYear()
      const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7)
      return `${year}-${week.toString().padStart(2, '0')}`
    }

    // Initialize weeks
    for (let i = 0; i < 12; i++) {
      const weekDate = new Date(twelveWeeksAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      const weekKey = getWeekKey(weekDate)
      weeklyData[weekKey] = { leads: 0, contacts: 0, revenue: 0, won: 0 }
    }

    // Process leads data
    leads?.forEach((lead: any) => {
      const createdAt = new Date(lead.created_at)
      const weekKey = getWeekKey(createdAt)
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].leads++
        if (lead.status === 'won') {
          weeklyData[weekKey].won++
          weeklyData[weekKey].revenue += lead.value || 0
        }
      }
    })

    // Process contacts data
    contacts?.forEach((contact: any) => {
      const createdAt = new Date(contact.created_at)
      const weekKey = getWeekKey(createdAt)
      if (weeklyData[weekKey]) {
        weeklyData[weekKey].contacts++
      }
    })

    // Convert to array format for charts
    const trendsData = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => {
        // Convert week key back to readable format
        const [year, weekNum] = week.split('-')
        const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(weekNum) - 1) * 7)
        const monthName = weekStart.toLocaleString('nl-NL', { month: 'short' })
        const day = weekStart.getDate()
        
        return {
          period: `${day} ${monthName}`,
          leads: data.leads,
          contacts: data.contacts,
          revenue: data.revenue,
          conversions: data.won
        }
      })

    return NextResponse.json({
      trends: trendsData,
      summary: {
        totalLeads: leads?.length || 0,
        totalContacts: contacts?.length || 0,
        totalRevenue: leads?.filter((l: any) => l.status === 'won').reduce((sum: number, l: any) => sum + (l.value || 0), 0) || 0,
        totalConversions: leads?.filter((l: any) => l.status === 'won').length || 0
      }
    })

  } catch (error) {
    console.error('Error in analytics trends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}