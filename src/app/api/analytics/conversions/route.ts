import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Deal {
  id: string;
  stage: string;
  status: string;
  value: number;
  source?: string;
  created_at: string;
  closed_date?: string;
  activities?: Array<{
    type: string;
    from?: string;
    to?: string;
  }>;
}

// GET /api/analytics/conversions - Get conversion funnel analytics
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'stage'; // stage, source, assignee

    // Build date range
    let dateFilter: { start: Date; end: Date };
    if (startDate && endDate) {
      dateFilter = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      // Default to last 90 days for conversion analysis
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      dateFilter = { start, end };
    }

    // Get all deals in the period
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString()) as { data: Deal[] | null; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Define pipeline stages in order
    const pipelineStages = [
      'lead',
      'qualified',
      'proposal',
      'negotiation',
      'closed'
    ];

    // Calculate funnel metrics
    const stageMetrics: Record<string, {
      count: number;
      value: number;
      wonCount: number;
      lostCount: number;
      avgTimeInStage: number;
      conversionToNext: number;
    }> = {};
    const conversionRates: Record<string, { converted: number; total: number }> = {};
    
    // Initialize stage metrics
    pipelineStages.forEach((stage: string) => {
      stageMetrics[stage] = {
        count: 0,
        value: 0,
        wonCount: 0,
        lostCount: 0,
        avgTimeInStage: 0,
        conversionToNext: 0
      };
    });

    // Process deals
    deals?.forEach((deal: Deal) => {
      const stage = deal.stage;
      if (stageMetrics[stage]) {
        stageMetrics[stage].count++;
        stageMetrics[stage].value += deal.value || 0;
        
        if (deal.status === 'won') {
          stageMetrics[stage].wonCount++;
        } else if (deal.status === 'lost') {
          stageMetrics[stage].lostCount++;
        }
      }

      // Track stage progression from activities
      if (deal.activities && Array.isArray(deal.activities)) {
        deal.activities
          .filter((a: any) => a.type === 'stage_change')
          .forEach((activity: any) => {
            const fromIndex = activity.from ? pipelineStages.indexOf(activity.from) : -1;
            const toIndex = activity.to ? pipelineStages.indexOf(activity.to) : -1;
            
            if (fromIndex >= 0 && toIndex > fromIndex) {
              if (activity.from && !conversionRates[activity.from]) {
                conversionRates[activity.from] = { converted: 0, total: 0 };
              }
              if (activity.from) {
                conversionRates[activity.from].converted++;
              }
            }
          });
      }
    });

    // Calculate conversion rates between stages
    for (let i = 0; i < pipelineStages.length - 1; i++) {
      const currentStage = pipelineStages[i];
      const nextStage = pipelineStages[i + 1];
      
      const currentCount = stageMetrics[currentStage].count;
      const nextCount = stageMetrics[nextStage].count + 
                       (conversionRates[currentStage]?.converted || 0);
      
      stageMetrics[currentStage].conversionToNext = 
        currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
    }

    // Calculate overall metrics
    const totalDeals = deals?.length || 0;
    const wonDeals = deals?.filter((d: Deal) => d.status === 'won').length || 0;
    const lostDeals = deals?.filter((d: Deal) => d.status === 'lost').length || 0;
    const overallConversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    // Calculate average deal velocity (days from creation to close)
    const closedDeals = deals?.filter((d: Deal) => d.status === 'won' || d.status === 'lost');
    const avgVelocity = closedDeals && closedDeals.length > 0 
      ? closedDeals.reduce((sum: number, deal: Deal) => {
          if (deal.closed_date) {
            const days = Math.ceil(
              (new Date(deal.closed_date).getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }
          return sum;
        }, 0) / closedDeals.length
      : 0;

    // Group by different dimensions
    let groupedData: Record<string, {
      total: number;
      won: number;
      lost: number;
      value: number;
      conversionRate: number;
    }> = {};
    if (groupBy === 'source' && deals) {
      groupedData = deals.reduce<typeof groupedData>((acc, deal) => {
        const source = deal.source || 'Direct';
        if (!acc[source]) {
          acc[source] = {
            total: 0,
            won: 0,
            lost: 0,
            value: 0,
            conversionRate: 0
          };
        }
        acc[source].total++;
        acc[source].value += deal.value || 0;
        if (deal.status === 'won') acc[source].won++;
        if (deal.status === 'lost') acc[source].lost++;
        return acc;
      }, {});

      // Calculate conversion rates
      Object.keys(groupedData).forEach((source: string) => {
        const data = groupedData[source];
        data.conversionRate = data.total > 0 ? (data.won / data.total) * 100 : 0;
      });
    }

    // Build funnel visualization data
    const funnelData = pipelineStages.map((stage: string, index: number) => ({
      stage,
      count: stageMetrics[stage].count,
      value: stageMetrics[stage].value,
      conversionRate: stageMetrics[stage].conversionToNext,
      dropoffRate: index > 0 ? 
        100 - stageMetrics[stage].conversionToNext : 0
    }));

    return NextResponse.json({
      summary: {
        totalDeals,
        wonDeals,
        lostDeals,
        overallConversionRate,
        avgDealVelocity: avgVelocity,
        period: {
          start: dateFilter.start.toISOString(),
          end: dateFilter.end.toISOString()
        }
      },
      funnel: funnelData,
      stageMetrics,
      bySource: groupBy === 'source' ? groupedData : null,
      trends: {
        // Can add time-based trend analysis here
        improving: overallConversionRate > 20, // Simple example
        velocityTrend: 'stable'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}