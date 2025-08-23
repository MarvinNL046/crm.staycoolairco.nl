import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      )
    }

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
      campaigns.forEach(campaign => {
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
  try {
    const body = await request.json()
    const { tenant_id, ...campaignData } = body

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      )
    }

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
        tenant_id,
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