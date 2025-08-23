import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get recipient stats if campaign has been sent - SECURED: Filter by tenant
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      const { data: recipientStats } = await supabase
        .from('campaign_recipients')
        .select('status')
        .eq('campaign_id', id)
        .eq('tenant_id', tenantId)

      if (recipientStats) {
        const stats = {
          total: recipientStats.length,
          delivered: recipientStats.filter((r: any) => r.status === 'delivered').length,
          opened: recipientStats.filter((r: any) => r.status === 'opened').length,
          clicked: recipientStats.filter((r: any) => r.status === 'clicked').length,
          bounced: recipientStats.filter((r: any) => r.status === 'bounced').length,
          unsubscribed: recipientStats.filter((r: any) => r.status === 'unsubscribed').length
        }
        campaign.recipientStats = stats
      }
    }

    return NextResponse.json({ campaign })

  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    const body = await request.json()
    
    // Update campaign - SECURED: Filter by tenant
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating campaign:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ campaign })

  } catch (error) {
    console.error('Error in campaign PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    // Only allow deletion of draft campaigns - SECURED: Filter by tenant
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft campaigns can be deleted' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting campaign:', error)
      return NextResponse.json(
        { error: 'Failed to delete campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Campaign deleted successfully' })

  } catch (error) {
    console.error('Error in campaign DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}