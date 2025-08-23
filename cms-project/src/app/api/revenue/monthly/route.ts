import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const currentDate = new Date()
    const twelveMonthsAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)

    // Get all won leads from the last 12 months
    const { data: wonLeads, error } = await supabase
      .from('leads')
      .select('value, created_at, source')
      .eq('status', 'won')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching monthly revenue data:', error)
      return NextResponse.json({ error: 'Failed to fetch monthly revenue data' }, { status: 500 })
    }

    // Group by month
    const monthlyData: { [key: string]: { revenue: number, deals: number, sources: { [key: string]: number } } } = {}
    
    // Initialize all months with zero values
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1)
      const monthKey = monthDate.toISOString().slice(0, 7) // YYYY-MM format
      monthlyData[monthKey] = { revenue: 0, deals: 0, sources: {} }
    }

    // Process won leads
    wonLeads?.forEach(lead => {
      const monthKey = lead.created_at.slice(0, 7) // YYYY-MM format
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += lead.value || 0
        monthlyData[monthKey].deals += 1
        
        const source = lead.source || 'Unknown'
        monthlyData[monthKey].sources[source] = (monthlyData[monthKey].sources[source] || 0) + (lead.value || 0)
      }
    })

    // Convert to array format for charts
    const monthlyRevenue = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const monthDate = new Date(month + '-01')
        const monthName = monthDate.toLocaleString('nl-NL', { month: 'short', year: 'numeric' })
        
        return {
          month: monthName,
          revenue: data.revenue,
          deals: data.deals,
          averageDealSize: data.deals > 0 ? data.revenue / data.deals : 0,
          topSource: Object.entries(data.sources).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
        }
      })

    // Calculate moving averages
    const movingAverages = monthlyRevenue.map((month, index) => {
      const threeMonthAvg = index >= 2 
        ? (monthlyRevenue[index].revenue + monthlyRevenue[index-1].revenue + monthlyRevenue[index-2].revenue) / 3
        : null

      return {
        ...month,
        threeMonthAvg
      }
    })

    // Get current month target (mock - in production this would come from a targets table)
    const currentMonthIndex = movingAverages.length - 1
    const currentMonthRevenue = movingAverages[currentMonthIndex]?.revenue || 0
    const previousMonthAvg = movingAverages[currentMonthIndex - 1]?.threeMonthAvg || 20000
    const monthlyTarget = previousMonthAvg * 1.1 // 10% growth target

    return NextResponse.json({
      monthly: movingAverages,
      summary: {
        totalRevenue: monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0),
        totalDeals: monthlyRevenue.reduce((sum, month) => sum + month.deals, 0),
        averageMonthlyRevenue: monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0) / 12,
        bestMonth: monthlyRevenue.reduce((best, month) => month.revenue > best.revenue ? month : best),
        currentMonthTarget: monthlyTarget,
        currentMonthActual: currentMonthRevenue,
        targetAchievement: (currentMonthRevenue / monthlyTarget) * 100
      }
    })

  } catch (error) {
    console.error('Error in monthly revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}