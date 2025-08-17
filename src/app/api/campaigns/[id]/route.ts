import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/campaigns/[id] - Get a single campaign with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Calculate metrics
    const metrics = {
      sent: data.metrics?.sent || 0,
      delivered: data.metrics?.delivered || 0,
      opened: data.metrics?.opened || 0,
      clicked: data.metrics?.clicked || 0,
      converted: data.metrics?.converted || 0,
      unsubscribed: data.metrics?.unsubscribed || 0,
      bounced: data.metrics?.bounced || 0,
      // Calculate rates
      deliveryRate: data.metrics?.sent > 0 
        ? (data.metrics.delivered / data.metrics.sent) * 100 : 0,
      openRate: data.metrics?.delivered > 0 
        ? (data.metrics.opened / data.metrics.delivered) * 100 : 0,
      clickRate: data.metrics?.opened > 0 
        ? (data.metrics.clicked / data.metrics.opened) * 100 : 0,
      conversionRate: data.metrics?.clicked > 0 
        ? (data.metrics.converted / data.metrics.clicked) * 100 : 0
    };

    return NextResponse.json({
      ...data,
      metrics
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - Update a campaign
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    // Get current campaign status
    const { data: currentCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Prevent editing active or completed campaigns (except status changes)
    if (['active', 'completed'].includes(currentCampaign.status) && 
        !body.status && Object.keys(body).length > 1) {
      return NextResponse.json(
        { error: 'Cannot edit active or completed campaigns' },
        { status: 400 }
      );
    }

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.created_at;
    delete body.metrics; // Metrics are updated separately

    // Add updated_at timestamp
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('campaigns')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - Delete a campaign
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if campaign exists and its status
    const { data: campaign, error: checkError } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', id)
      .single();

    if (checkError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Prevent deleting active campaigns
    if (campaign.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active campaigns. Please pause or complete it first.' },
        { status: 400 }
      );
    }

    // Delete campaign
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}