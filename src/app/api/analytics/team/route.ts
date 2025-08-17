import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/analytics/team - Get team performance analytics
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');

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

    // Get users/team members
    let userQuery = supabase.from('users').select('id, name, email, role, team_id');
    if (teamId) {
      userQuery = userQuery.eq('team_id', teamId);
    }
    if (userId) {
      userQuery = userQuery.eq('id', userId);
    }

    const { data: users, error: userError } = await userQuery;

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // Get deals for performance metrics
    let dealsQuery = supabase
      .from('deals')
      .select('*')
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString());

    if (userId) {
      dealsQuery = dealsQuery.eq('assigned_to', userId);
    } else if (teamId && users) {
      const teamUserIds = users.map((u: any) => u.id);
      dealsQuery = dealsQuery.in('assigned_to', teamUserIds);
    }

    const { data: deals, error: dealsError } = await dealsQuery;

    if (dealsError) {
      return NextResponse.json({ error: dealsError.message }, { status: 400 });
    }

    // Get tasks for activity metrics
    let tasksQuery = supabase
      .from('tasks')
      .select('*')
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString());

    if (userId) {
      tasksQuery = tasksQuery.eq('assigned_to', userId);
    }

    const { data: tasks } = await tasksQuery;

    // Get activities/interactions
    let activitiesQuery = supabase
      .from('activities')
      .select('*')
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString());

    if (userId) {
      activitiesQuery = activitiesQuery.eq('user_id', userId);
    }

    const { data: activities } = await activitiesQuery;

    // Calculate individual performance metrics
    const performanceByUser: Record<string, any> = {};
    
    users?.forEach((user: any) => {
      const userDeals = deals?.filter((d: any) => d.assigned_to === user.id) || [];
      const userTasks = tasks?.filter((t: any) => t.assigned_to === user.id) || [];
      const userActivities = activities?.filter((a: any) => a.user_id === user.id) || [];

      const wonDeals = userDeals.filter((d: any) => d.status === 'won');
      const revenue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

      (performanceByUser as any)[user.id] = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        deals: {
          total: userDeals.length,
          won: wonDeals.length,
          lost: userDeals.filter((d: any) => d.status === 'lost').length,
          open: userDeals.filter((d: any) => d.status === 'open').length,
          revenue,
          avgDealSize: wonDeals.length > 0 ? revenue / wonDeals.length : 0,
          conversionRate: userDeals.length > 0 ? (wonDeals.length / userDeals.length) * 100 : 0
        },
        tasks: {
          total: userTasks.length,
          completed: userTasks.filter((t: any) => t.status === 'completed').length,
          overdue: userTasks.filter((t: any) => 
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
          ).length,
          completionRate: userTasks.length > 0 
            ? (userTasks.filter((t: any) => t.status === 'completed').length / userTasks.length) * 100 
            : 0
        },
        activities: {
          total: userActivities.length,
          calls: userActivities.filter((a: any) => a.type === 'call').length,
          emails: userActivities.filter((a: any) => a.type === 'email').length,
          meetings: userActivities.filter((a: any) => a.type === 'meeting').length,
          avgPerDay: userActivities.length / 
            Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24))
        }
      };
    });

    // Calculate team summary
    const teamSummary = {
      totalRevenue: Object.values(performanceByUser).reduce((sum: number, u: any) => sum + u.deals.revenue, 0),
      totalDeals: deals?.length || 0,
      wonDeals: deals?.filter((d: any) => d.status === 'won').length || 0,
      avgConversionRate: (Object.values(performanceByUser).reduce((sum: number, u: any) => sum + u.deals.conversionRate, 0) / 
        (Object.keys(performanceByUser).length || 1)) as number,
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter((t: any) => t.status === 'completed').length || 0,
      totalActivities: activities?.length || 0
    };

    // Identify top performers
    const rankings = {
      byRevenue: Object.entries(performanceByUser)
        .sort((a: any, b: any) => b[1].deals.revenue - a[1].deals.revenue)
        .slice(0, 5)
        .map(([id, data]: [string, any]) => ({ ...data.user, revenue: data.deals.revenue })),
      byDeals: Object.entries(performanceByUser)
        .sort((a: any, b: any) => b[1].deals.won - a[1].deals.won)
        .slice(0, 5)
        .map(([id, data]: [string, any]) => ({ ...data.user, dealsWon: data.deals.won })),
      byActivities: Object.entries(performanceByUser)
        .sort((a: any, b: any) => b[1].activities.total - a[1].activities.total)
        .slice(0, 5)
        .map(([id, data]: [string, any]) => ({ ...data.user, activities: data.activities.total }))
    };

    return NextResponse.json({
      summary: teamSummary,
      period: {
        start: dateFilter.start.toISOString(),
        end: dateFilter.end.toISOString()
      },
      individualPerformance: Object.values(performanceByUser),
      rankings,
      trends: {
        // Can add week-over-week or month-over-month trends
        revenueGrowth: 'calculating...',
        activityTrend: 'calculating...'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}