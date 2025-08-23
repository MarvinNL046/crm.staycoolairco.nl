import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    // Get current month data
    const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1)
    const firstDayNextMonth = new Date(currentYear, currentMonth + 1, 1)
    
    // Get previous month data for comparison
    const firstDayPreviousMonth = new Date(currentYear, currentMonth - 1, 1)
    
    // Get year to date data
    const firstDayYear = new Date(currentYear, 0, 1)
    
    // Get all revenue-generating leads (won status)
    const { data: allWonLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'won')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching revenue data:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Calculate metrics
    const currentMonthRevenue = allWonLeads?.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= firstDayCurrentMonth && leadDate < firstDayNextMonth
    }).reduce((sum, lead) => sum + (lead.value || 0), 0) || 0

    const previousMonthRevenue = allWonLeads?.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= firstDayPreviousMonth && leadDate < firstDayCurrentMonth
    }).reduce((sum, lead) => sum + (lead.value || 0), 0) || 0

    const yearToDateRevenue = allWonLeads?.filter(lead => {
      const leadDate = new Date(lead.created_at)
      return leadDate >= firstDayYear
    }).reduce((sum, lead) => sum + (lead.value || 0), 0) || 0

    const totalRevenue = allWonLeads?.reduce((sum, lead) => sum + (lead.value || 0), 0) || 0

    // Calculate average deal size
    const averageDealSize = allWonLeads && allWonLeads.length > 0 
      ? totalRevenue / allWonLeads.length 
      : 0

    // Group revenue by source
    const revenueBySource: { [key: string]: number } = {}
    allWonLeads?.forEach(lead => {
      const source = lead.source || 'Unknown'
      revenueBySource[source] = (revenueBySource[source] || 0) + (lead.value || 0)
    })

    // Group revenue by assigned person
    const revenueByPerson: { [key: string]: number } = {}
    allWonLeads?.forEach(lead => {
      const person = lead.assignedTo || 'Unassigned'
      revenueByPerson[person] = (revenueByPerson[person] || 0) + (lead.value || 0)
    })

    // Calculate growth rate
    const monthOverMonthGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0

    // Get quarterly data
    const quarterlyRevenue = []
    for (let q = 0; q < 4; q++) {
      const quarterStart = new Date(currentYear, q * 3, 1)
      const quarterEnd = new Date(currentYear, (q + 1) * 3, 1)
      const quarterRevenue = allWonLeads?.filter(lead => {
        const leadDate = new Date(lead.created_at)
        return leadDate >= quarterStart && leadDate < quarterEnd
      }).reduce((sum, lead) => sum + (lead.value || 0), 0) || 0
      
      quarterlyRevenue.push({
        quarter: `Q${q + 1}`,
        revenue: quarterRevenue
      })
    }

    return NextResponse.json({
      overview: {
        currentMonth: currentMonthRevenue,
        previousMonth: previousMonthRevenue,
        yearToDate: yearToDateRevenue,
        totalRevenue,
        averageDealSize,
        monthOverMonthGrowth,
        totalDeals: allWonLeads?.length || 0
      },
      bySource: Object.entries(revenueBySource).map(([source, revenue]) => ({
        source,
        revenue,
        percentage: (revenue / totalRevenue) * 100
      })).sort((a, b) => b.revenue - a.revenue),
      byPerson: Object.entries(revenueByPerson).map(([person, revenue]) => ({
        person,
        revenue,
        deals: allWonLeads?.filter(lead => (lead.assignedTo || 'Unassigned') === person).length || 0
      })).sort((a, b) => b.revenue - a.revenue),
      quarterly: quarterlyRevenue
    })

  } catch (error) {
    console.error('Error in revenue overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}