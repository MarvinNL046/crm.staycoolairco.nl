import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/campaigns - List all campaigns with filtering and metrics
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // draft, scheduled, active, paused, completed
    const type = searchParams.get('type'); // email, sms, social, multi-channel
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Enrich campaigns with metrics
    const enrichedCampaigns = await Promise.all(
      (data || []).map(async (campaign: any) => {
        // Get campaign metrics from separate table or calculate
        const metrics = {
          sent: campaign.metrics?.sent || 0,
          delivered: campaign.metrics?.delivered || 0,
          opened: campaign.metrics?.opened || 0,
          clicked: campaign.metrics?.clicked || 0,
          converted: campaign.metrics?.converted || 0,
          unsubscribed: campaign.metrics?.unsubscribed || 0,
          bounced: campaign.metrics?.bounced || 0,
          // Calculate rates
          deliveryRate: campaign.metrics?.sent > 0 
            ? (campaign.metrics.delivered / campaign.metrics.sent) * 100 : 0,
          openRate: campaign.metrics?.delivered > 0 
            ? (campaign.metrics.opened / campaign.metrics.delivered) * 100 : 0,
          clickRate: campaign.metrics?.opened > 0 
            ? (campaign.metrics.clicked / campaign.metrics.opened) * 100 : 0,
          conversionRate: campaign.metrics?.clicked > 0 
            ? (campaign.metrics.converted / campaign.metrics.clicked) * 100 : 0
        };

        return {
          ...campaign,
          metrics
        };
      })
    );

    return NextResponse.json({
      data: enrichedCampaigns,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate campaign type
    const validTypes = ['email', 'sms', 'social', 'multi-channel'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid campaign type' },
        { status: 400 }
      );
    }

    // Create campaign with default values
    const campaignData = {
      name: body.name,
      description: body.description || null,
      type: body.type,
      status: body.status || 'draft',
      // Targeting
      target_audience: body.target_audience || {},
      segments: body.segments || [],
      filters: body.filters || {},
      // Content
      subject: body.subject || null,
      preview_text: body.preview_text || null,
      content: body.content || {},
      template_id: body.template_id || null,
      // Scheduling
      scheduled_at: body.scheduled_at || null,
      timezone: body.timezone || 'UTC',
      send_time_optimization: body.send_time_optimization || false,
      // Settings
      ab_testing: body.ab_testing || false,
      ab_variants: body.ab_variants || [],
      tracking: body.tracking !== false, // Default true
      utm_parameters: body.utm_parameters || {},
      // Goals
      goals: body.goals || {
        target_opens: null,
        target_clicks: null,
        target_conversions: null
      },
      // Metrics (initialized)
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        unsubscribed: 0,
        bounced: 0
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}