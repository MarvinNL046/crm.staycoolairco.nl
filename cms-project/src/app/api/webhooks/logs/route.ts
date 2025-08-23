/**
 * Webhook Logs API
 * View webhook request logs and security events
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'

// GET /api/webhooks/logs - Get webhook logs with filtering and pagination
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per page
    const webhookType = searchParams.get('type') // 'lead_capture', 'workflow_trigger', etc.
    const status = searchParams.get('status') // '200', '400', '500', etc.
    const since = searchParams.get('since') // ISO date string
    const clientIp = searchParams.get('ip')

    // Build query
    let query = supabase
      .from('webhook_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (webhookType) {
      query = query.eq('webhook_type', webhookType)
    }

    if (status) {
      const statusCode = parseInt(status)
      if (!isNaN(statusCode)) {
        query = query.eq('response_status', statusCode)
      }
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

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching webhook logs:', error)
      return NextResponse.json({ error: 'Failed to fetch webhook logs' }, { status: 500 })
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        type: webhookType,
        status,
        since,
        ip: clientIp
      }
    })

  } catch (error) {
    console.error('Error in GET /api/webhooks/logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/webhooks/logs - Clean up old webhook logs
export async function DELETE(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request)
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status)
  }

  const { supabase, tenantId } = authResult
  const { searchParams } = new URL(request.url)

  try {
    // Get cleanup parameters
    const daysOld = parseInt(searchParams.get('days') || '30')
    const confirmCleanup = searchParams.get('confirm') === 'true'

    if (!confirmCleanup) {
      return NextResponse.json(
        { error: 'Cleanup must be confirmed with ?confirm=true parameter' },
        { status: 400 }
      )
    }

    if (daysOld < 1 || daysOld > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Delete old logs
    const { data, error } = await supabase
      .from('webhook_logs')
      .delete()
      .eq('tenant_id', tenantId)
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error deleting old webhook logs:', error)
      return NextResponse.json({ error: 'Failed to clean up webhook logs' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully cleaned up webhook logs older than ${daysOld} days`,
      cutoffDate: cutoffDate.toISOString(),
      deletedCount: data?.length || 0
    })

  } catch (error) {
    console.error('Error in DELETE /api/webhooks/logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}