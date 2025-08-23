import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: campaigns, error, count } = await query

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }

    // Calculate summary stats
    const stats = {
      total: count || 0,
      draft: 0,
      scheduled: 0,
      sent: 0,
      sending: 0
    }

    if (campaigns) {
      campaigns.forEach((campaign: any) => {
        if (campaign.status === 'draft') stats.draft++
        else if (campaign.status === 'scheduled') stats.scheduled++
        else if (campaign.status === 'sent') stats.sent++
        else if (campaign.status === 'sending') stats.sending++
      })
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      total: count || 0,
      stats
    })

  } catch (error) {
    console.error('Error in campaigns GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const body = await request.json()
    const { ...campaignData } = body

    // Validate required fields
    if (!campaignData.name || !campaignData.subject || !campaignData.from_name || !campaignData.from_email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, from_name, from_email' },
        { status: 400 }
      )
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        tenant_id: tenantId,
        ...campaignData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ campaign }, { status: 201 })

  } catch (error) {
    console.error('Error in campaigns POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}