/**
 * Webhook Configuration API
 * Manage webhook settings, secrets, and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'
import crypto from 'crypto'

// Generate secure webhook secret
function generateWebhookSecret(): string {
  const secret = crypto.randomBytes(32).toString('hex')
  return `whsec_${secret}`
}

// GET /api/webhooks/config - Get webhook configuration
export async function GET(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request)
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status)
  }

  const { supabase, tenantId } = authResult

  try {
    const { data: config, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching webhook config:', error)
      return NextResponse.json({ error: 'Failed to fetch webhook configuration' }, { status: 500 })
    }

    // Don't expose the actual secret, just indicate if it exists
    const responseConfig = {
      ...config,
      webhook_secret: config.webhook_secret ? '••••••••' : null,
      has_secret: !!config.webhook_secret
    }

    return NextResponse.json({ config: responseConfig })

  } catch (error) {
    console.error('Error in GET /api/webhooks/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/webhooks/config - Update webhook configuration
export async function PUT(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request)
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status)
  }

  const { supabase, tenantId } = authResult

  try {
    const body = await request.json()

    const updates: any = {}

    // Update rate limit if provided
    if (body.rate_limit_per_minute !== undefined) {
      if (typeof body.rate_limit_per_minute !== 'number' || 
          body.rate_limit_per_minute < 1 || 
          body.rate_limit_per_minute > 1000) {
        return NextResponse.json(
          { error: 'Rate limit must be a number between 1 and 1000' },
          { status: 400 }
        )
      }
      updates.rate_limit_per_minute = body.rate_limit_per_minute
    }

    // Update active status if provided
    if (body.is_active !== undefined) {
      updates.is_active = !!body.is_active
    }

    // Generate new secret if requested
    if (body.regenerate_secret === true) {
      updates.webhook_secret = generateWebhookSecret()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data: updatedConfig, error } = await supabase
      .from('webhook_configs')
      .update(updates)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating webhook config:', error)
      return NextResponse.json({ error: 'Failed to update webhook configuration' }, { status: 500 })
    }

    // Don't expose the actual secret in response
    const responseConfig = {
      ...updatedConfig,
      webhook_secret: updatedConfig.webhook_secret ? '••••••••' : null,
      has_secret: !!updatedConfig.webhook_secret,
      // Include new secret only if it was regenerated
      new_secret: body.regenerate_secret === true ? updatedConfig.webhook_secret : undefined
    }

    return NextResponse.json({ 
      config: responseConfig,
      message: 'Webhook configuration updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/webhooks/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/webhooks/config - Create webhook configuration (initialize)
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request)
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status)
  }

  const { supabase, tenantId } = authResult

  try {
    // Check if config already exists
    const { data: existingConfig } = await supabase
      .from('webhook_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (existingConfig) {
      return NextResponse.json(
        { error: 'Webhook configuration already exists' },
        { status: 409 }
      )
    }

    // Create new webhook configuration
    const newConfig = {
      tenant_id: tenantId,
      webhook_secret: generateWebhookSecret(),
      webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm.staycoolairco.nl'}/api/webhook/leads?tenant=${tenantId}`,
      is_active: true,
      rate_limit_per_minute: 60
    }

    const { data: createdConfig, error } = await supabase
      .from('webhook_configs')
      .insert(newConfig)
      .select()
      .single()

    if (error) {
      console.error('Error creating webhook config:', error)
      return NextResponse.json({ error: 'Failed to create webhook configuration' }, { status: 500 })
    }

    // Return config with the secret (one-time only)
    const responseConfig = {
      ...createdConfig,
      new_secret: createdConfig.webhook_secret,
      webhook_secret: '••••••••',
      has_secret: true
    }

    return NextResponse.json({ 
      config: responseConfig,
      message: 'Webhook configuration created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/webhooks/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}