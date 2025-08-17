import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/analytics/revenue - Get revenue analytics
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const period = searchParams.get('period') || 'month'; // day, week, month, quarter, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month
    const includeForecasts = searchParams.get('includeForecasts') === 'true';

    // Build date range
    let dateFilter: { start: Date; end: Date };
    if (startDate && endDate) {
      dateFilter = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      dateFilter = { start, end };
    }

    // Get won deals for revenue
    const { data: wonDeals, error: wonError } = await supabase
      .from('deals')
      .select('value, closed_date, customer_id')
      .eq('status', 'won')
      .gte('closed_date', dateFilter.start.toISOString())
      .lte('closed_date', dateFilter.end.toISOString());

    if (wonError) {
      return NextResponse.json({ error: wonError.message }, { status: 400 });
    }

    // Get open deals for pipeline value
    const { data: openDeals, error: openError } = await supabase
      .from('deals')
      .select('value, probability, expected_close_date, stage')
      .eq('status', 'open');

    if (openError) {
      return NextResponse.json({ error: openError.message }, { status: 400 });
    }

    // Calculate revenue metrics
    const totalRevenue = wonDeals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;
    const dealCount = wonDeals?.length || 0;
    const averageDealSize = dealCount > 0 ? totalRevenue / dealCount : 0;

    // Calculate pipeline metrics
    const pipelineValue = openDeals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;
    const weightedPipelineValue = openDeals?.reduce((sum: number, deal: any) => 
      sum + ((deal.value || 0) * (deal.probability || 0) / 100), 0
    ) || 0;

    // Group revenue by time period
    const revenueByPeriod: Record<string, { revenue: number; deals: number }> = {};
    wonDeals?.forEach((deal: any) => {
      const date = new Date(deal.closed_date);
      let key;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = {
          revenue: 0,
          deals: 0
        };
      }
      revenueByPeriod[key].revenue += deal.value || 0;
      revenueByPeriod[key].deals += 1;
    });

    // Convert to array and sort
    const timeSeriesData = Object.entries(revenueByPeriod)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate growth metrics
    const currentPeriodRevenue = totalRevenue;
    const previousPeriodStart = new Date(dateFilter.start);
    const previousPeriodEnd = new Date(dateFilter.end);
    const periodDays = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - periodDays);

    const { data: previousDeals } = await supabase
      .from('deals')
      .select('value')
      .eq('status', 'won')
      .gte('closed_date', previousPeriodStart.toISOString())
      .lte('closed_date', previousPeriodEnd.toISOString());

    const previousPeriodRevenue = previousDeals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;
    const growthRate = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    // Forecast calculation (simple linear projection)
    let forecast = null;
    if (includeForecasts && timeSeriesData.length > 1) {
      const recentTrend = timeSeriesData.slice(-7).map((d: any) => d.revenue);
      const avgDailyRevenue = recentTrend.reduce((a: number, b: number) => a + b, 0) / recentTrend.length;
      
      forecast = {
        next30Days: avgDailyRevenue * 30,
        nextQuarter: avgDailyRevenue * 90,
        confidence: 0.7 // Simple confidence score
      };
    }

    return NextResponse.json({
      summary: {
        totalRevenue,
        dealCount,
        averageDealSize,
        growthRate,
        period: {
          start: dateFilter.start.toISOString(),
          end: dateFilter.end.toISOString()
        }
      },
      pipeline: {
        totalValue: pipelineValue,
        weightedValue: weightedPipelineValue,
        dealCount: openDeals?.length || 0
      },
      timeSeries: timeSeriesData,
      forecast,
      byCustomer: null, // Can be implemented if needed
      byProduct: null   // Can be implemented if needed
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}