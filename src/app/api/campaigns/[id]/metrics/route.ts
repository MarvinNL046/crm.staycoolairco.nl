import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/campaigns/[id]/metrics - Update campaign metrics
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    // Get current campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('metrics, status')
      .eq('id', id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Validate metrics update
    const validMetrics = ['sent', 'delivered', 'opened', 'clicked', 'converted', 'unsubscribed', 'bounced'];
    const metricsUpdate: Record<string, number> = {};
    
    for (const metric of validMetrics) {
      if (body[metric] !== undefined) {
        metricsUpdate[metric] = body[metric];
      }
    }

    // Merge with existing metrics
    const updatedMetrics = {
      ...campaign.metrics,
      ...metricsUpdate
    };

    // Update campaign metrics
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        metrics: updatedMetrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate rates
    const enrichedMetrics = {
      ...updatedMetrics,
      deliveryRate: updatedMetrics.sent > 0 
        ? (updatedMetrics.delivered / updatedMetrics.sent) * 100 : 0,
      openRate: updatedMetrics.delivered > 0 
        ? (updatedMetrics.opened / updatedMetrics.delivered) * 100 : 0,
      clickRate: updatedMetrics.opened > 0 
        ? (updatedMetrics.clicked / updatedMetrics.opened) * 100 : 0,
      conversionRate: updatedMetrics.clicked > 0 
        ? (updatedMetrics.converted / updatedMetrics.clicked) * 100 : 0
    };

    return NextResponse.json({
      campaignId: id,
      metrics: enrichedMetrics,
      updated: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/campaigns/[id]/metrics - Get detailed campaign metrics and analytics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const { id } = await params;
    
    // Get time range for analytics
    const timeRange = searchParams.get('range') || '7d'; // 1d, 7d, 30d, all

    // Get campaign
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Calculate basic metrics
    const metrics = campaign.metrics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      bounced: 0
    };

    // Calculate rates
    const rates = {
      deliveryRate: metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
      openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
      clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0,
      conversionRate: metrics.clicked > 0 ? (metrics.converted / metrics.clicked) * 100 : 0,
      unsubscribeRate: metrics.delivered > 0 ? (metrics.unsubscribed / metrics.delivered) * 100 : 0,
      bounceRate: metrics.sent > 0 ? (metrics.bounced / metrics.sent) * 100 : 0
    };

    // Goal achievement
    const goalAchievement = {
      opens: campaign.goals?.target_opens 
        ? (metrics.opened / campaign.goals.target_opens) * 100 : null,
      clicks: campaign.goals?.target_clicks 
        ? (metrics.clicked / campaign.goals.target_clicks) * 100 : null,
      conversions: campaign.goals?.target_conversions 
        ? (metrics.converted / campaign.goals.target_conversions) * 100 : null
    };

    // A/B testing results if applicable
    let abTestResults = null;
    if (campaign.ab_testing && campaign.ab_variants) {
      abTestResults = campaign.ab_variants.map((variant: any) => ({
        variant: variant.name,
        sent: variant.metrics?.sent || 0,
        openRate: variant.metrics?.delivered > 0 
          ? (variant.metrics.opened / variant.metrics.delivered) * 100 : 0,
        clickRate: variant.metrics?.opened > 0 
          ? (variant.metrics.clicked / variant.metrics.opened) * 100 : 0,
        conversionRate: variant.metrics?.clicked > 0 
          ? (variant.metrics.converted / variant.metrics.clicked) * 100 : 0,
        winner: variant.winner || false
      }));
    }

    // Performance comparison (vs previous campaigns)
    const { data: previousCampaigns } = await supabase
      .from('campaigns')
      .select('metrics')
      .eq('type', campaign.type)
      .neq('id', campaign.id)
      .not('metrics', 'is', null)
      .limit(5);

    let performanceComparison = null;
    if (previousCampaigns && previousCampaigns.length > 0) {
      const avgOpenRate = previousCampaigns.reduce((sum: number, c: any) => {
        const delivered = c.metrics.delivered || 0;
        const opened = c.metrics.opened || 0;
        return sum + (delivered > 0 ? (opened / delivered) * 100 : 0);
      }, 0) / previousCampaigns.length;

      const avgClickRate = previousCampaigns.reduce((sum: number, c: any) => {
        const opened = c.metrics.opened || 0;
        const clicked = c.metrics.clicked || 0;
        return sum + (opened > 0 ? (clicked / opened) * 100 : 0);
      }, 0) / previousCampaigns.length;

      performanceComparison = {
        openRateDiff: rates.openRate - avgOpenRate,
        clickRateDiff: rates.clickRate - avgClickRate,
        performance: rates.openRate > avgOpenRate ? 'above_average' : 'below_average'
      };
    }

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        created_at: campaign.created_at,
        scheduled_at: campaign.scheduled_at
      },
      metrics,
      rates,
      goalAchievement,
      abTestResults,
      performanceComparison,
      recommendations: {
        // Simple recommendations based on metrics
        lowOpenRate: rates.openRate < 20 ? 'Consider improving subject line' : null,
        lowClickRate: rates.clickRate < 2 ? 'Review content and CTAs' : null,
        highBounceRate: rates.bounceRate > 5 ? 'Clean up email list' : null,
        highUnsubscribeRate: rates.unsubscribeRate > 2 ? 'Review content relevance' : null
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}