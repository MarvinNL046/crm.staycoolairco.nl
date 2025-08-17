import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/analytics/customers - Get customer analytics
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const segment = searchParams.get('segment'); // new, active, churned

    // Build date range
    let dateFilter: { start: Date; end: Date };
    if (startDate && endDate) {
      dateFilter = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    } else {
      // Default to last 90 days
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      dateFilter = { start, end };
    }

    // Get all customers
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*');

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 400 });
    }

    // Get deals for customer value calculation
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('customer_id, value, status, created_at, closed_date');

    if (dealsError) {
      return NextResponse.json({ error: dealsError.message }, { status: 400 });
    }

    // Calculate customer metrics
    const customerMetrics: Record<string, any> = {};
    const customerSegments: Record<string, string[]> = {
      new: [],
      active: [],
      atrisk: [],
      churned: [],
      vip: []
    };

    customers?.forEach((customer: any) => {
      const customerDeals = deals?.filter((d: any) => d.customer_id === customer.id) || [];
      const wonDeals = customerDeals.filter((d: any) => d.status === 'won');
      const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
      
      // Calculate days since last deal
      const lastDealDate = Math.max(...customerDeals
        .filter((d: any) => d.closed_date)
        .map((d: any) => new Date(d.closed_date).getTime()), 0);
      const daysSinceLastDeal = lastDealDate > 0 
        ? Math.ceil((new Date().getTime() - lastDealDate) / (1000 * 60 * 60 * 24))
        : null;

      // Customer lifetime (days since first deal)
      const firstDealDate = Math.min(...customerDeals
        .map((d: any) => new Date(d.created_at).getTime()));
      const customerLifetime = firstDealDate < Infinity
        ? Math.ceil((new Date().getTime() - firstDealDate) / (1000 * 60 * 60 * 24))
        : 0;

      // Segment customers
      if (customerLifetime < 30) {
        customerSegments.new.push(customer.id);
      } else if (daysSinceLastDeal && daysSinceLastDeal < 90) {
        customerSegments.active.push(customer.id);
      } else if (daysSinceLastDeal && daysSinceLastDeal < 180) {
        customerSegments.atrisk.push(customer.id);
      } else if (daysSinceLastDeal && daysSinceLastDeal >= 180) {
        customerSegments.churned.push(customer.id);
      }

      if (totalRevenue > 10000) { // VIP threshold
        customerSegments.vip.push(customer.id);
      }

      (customerMetrics as any)[customer.id] = {
        customer: {
          id: customer.id,
          name: customer.name,
          company: customer.company,
          status: customer.status
        },
        metrics: {
          totalRevenue,
          dealCount: customerDeals.length,
          wonDeals: wonDeals.length,
          avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
          lifetime: customerLifetime,
          daysSinceLastDeal,
          segment: daysSinceLastDeal === null ? 'prospect' :
                  daysSinceLastDeal < 90 ? 'active' :
                  daysSinceLastDeal < 180 ? 'at-risk' : 'churned'
        }
      };
    });

    // Calculate summary metrics
    const totalCustomers = customers?.length || 0;
    const totalRevenue = Object.values(customerMetrics).reduce((sum: number, c: any) => sum + c.metrics.totalRevenue, 0) as number;
    const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Calculate acquisition and churn metrics
    const newCustomersInPeriod = customers?.filter((c: any) => {
      const createdDate = new Date(c.created_at);
      return createdDate >= dateFilter.start && createdDate <= dateFilter.end;
    }).length || 0;

    const churnedInPeriod = customerSegments.churned.filter((id: string) => {
      const customer = (customerMetrics as any)[id];
      return customer.metrics.daysSinceLastDeal && 
             customer.metrics.daysSinceLastDeal >= 180 &&
             customer.metrics.daysSinceLastDeal < 270; // Churned in last 90 days
    }).length;

    const churnRate = totalCustomers > 0 ? (churnedInPeriod / totalCustomers) * 100 : 0;

    // Top customers by revenue
    const topCustomers = Object.values(customerMetrics)
      .sort((a: any, b: any) => b.metrics.totalRevenue - a.metrics.totalRevenue)
      .slice(0, 10);

    // Segment analysis
    const segmentAnalysis = {
      new: {
        count: customerSegments.new.length,
        revenue: customerSegments.new.reduce((sum: number, id: string) => 
          sum + ((customerMetrics as any)[id]?.metrics.totalRevenue || 0), 0
        )
      },
      active: {
        count: customerSegments.active.length,
        revenue: customerSegments.active.reduce((sum: number, id: string) => 
          sum + ((customerMetrics as any)[id]?.metrics.totalRevenue || 0), 0
        )
      },
      atrisk: {
        count: customerSegments.atrisk.length,
        revenue: customerSegments.atrisk.reduce((sum: number, id: string) => 
          sum + ((customerMetrics as any)[id]?.metrics.totalRevenue || 0), 0
        )
      },
      churned: {
        count: customerSegments.churned.length,
        revenue: customerSegments.churned.reduce((sum: number, id: string) => 
          sum + ((customerMetrics as any)[id]?.metrics.totalRevenue || 0), 0
        )
      },
      vip: {
        count: customerSegments.vip.length,
        revenue: customerSegments.vip.reduce((sum: number, id: string) => 
          sum + ((customerMetrics as any)[id]?.metrics.totalRevenue || 0), 0
        )
      }
    };

    return NextResponse.json({
      summary: {
        totalCustomers,
        totalRevenue,
        avgCustomerValue,
        newCustomersInPeriod,
        churnRate,
        period: {
          start: dateFilter.start.toISOString(),
          end: dateFilter.end.toISOString()
        }
      },
      segments: segmentAnalysis,
      topCustomers,
      customerList: segment ? 
        Object.values(customerMetrics).filter((c: any) => c.metrics.segment === segment) :
        Object.values(customerMetrics),
      trends: {
        acquisitionTrend: 'calculating...',
        retentionTrend: 'calculating...',
        revenueTrend: 'calculating...'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}