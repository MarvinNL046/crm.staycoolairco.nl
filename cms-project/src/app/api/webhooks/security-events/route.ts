/**
 * Webhook Security Events API
 * Monitor security events and suspicious activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'

// GET /api/webhooks/security-events - Get security events
export async function GET(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request)
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status)
  }

  const { supabase, tenantId } = authResult
  const { searchParams } = new URL(request.url)

  try {
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const eventType = searchParams.get('type') // 'invalid_signature', 'rate_limit_exceeded', etc.
    const severity = searchParams.get('severity') // 'low', 'medium', 'high', 'critical'
    const since = searchParams.get('since') // ISO date string
    const clientIp = searchParams.get('ip')

    // Build query
    let query = supabase
      .from('webhook_security_events')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (since) {
      const sinceDate = new Date(since)
      if (!isNaN(sinceDate.getTime())) {
        query = query.gte('created_at', sinceDate.toISOString())
      }
    }

    if (clientIp) {
      query = query.eq('client_ip', clientIp)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: events, error, count } = await query

    if (error) {
      console.error('Error fetching security events:', error)
      return NextResponse.json({ error: 'Failed to fetch security events' }, { status: 500 })
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('webhook_security_events')
      .select('event_type, severity')
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h

    // Aggregate stats
    const eventStats = stats?.reduce((acc: any, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {}) || {}

    const severityStats = stats?.reduce((acc: any, event: any) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      events: events || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      stats: {
        last24h: {
          total: stats?.length || 0,
          byType: eventStats,
          bySeverity: severityStats
        }
      },
      filters: {
        type: eventType,
        severity,
        since,
        ip: clientIp
      }
    })

  } catch (error) {
    console.error('Error in GET /api/webhooks/security-events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}