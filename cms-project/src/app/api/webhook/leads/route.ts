/**
 * Production-Ready Lead Webhook API
 * Secure, monitored, and fully functional webhook endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createBrowserClient } from '@supabase/ssr'
import {
  WebhookRateLimit,
  WebhookLogger,
  WebhookValidator,
  validateWebhookSignature,
  getClientIP,
  getWebhookConfig
} from '@/lib/webhook-security'

// Webhook payload interface
interface WebhookPayload {
  name: string
  email: string
  phone?: string
  company?: string
  message?: string
  source?: string
  website?: string
  metadata?: Record<string, any>
  [key: string]: any
}

// Create Supabase client with fallback to anon key
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Transform webhook data to lead format
function transformToLead(payload: WebhookPayload, tenantId: string) {
  // Extract company name from email domain if not provided
  const emailDomain = payload.email?.split('@')[1]
  const companyFromEmail = emailDomain ? 
    emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1) : 
    'Unknown Company'

  return {
    tenant_id: tenantId,
    company_name: payload.company || companyFromEmail,
    contact_name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    website: payload.website || (emailDomain ? `https://${emailDomain}` : null),
    source: payload.source || 'WEBHOOK',
    status: 'NEW',
    priority: 'MEDIUM',
    description: payload.message || 'Lead from webhook',
    notes: `Auto-imported from webhook\n\nSource: ${payload.source || 'unknown'}\nReceived: ${new Date().toISOString()}`,
    metadata: payload.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let tenantId: string | null = null
  let webhookLogger: WebhookLogger | null = null
  let clientIp: string = 'unknown'

  try {
    // Get client IP and headers
    clientIp = getClientIP(request)
    const signature = request.headers.get('x-webhook-signature')
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get tenant ID from URL parameter
    const { searchParams } = new URL(request.url)
    tenantId = searchParams.get('tenant')
    
    if (!tenantId) {
      return NextResponse.json(
        { 
          error: 'Missing tenant parameter',
          message: 'Webhook URL must include tenant parameter'
        },
        { status: 400 }
      )
    }

    // Initialize webhook logger
    webhookLogger = new WebhookLogger()
    
    // Get raw body for signature validation
    const body = await request.text()
    
    // Parse JSON payload
    let payload: WebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      await webhookLogger?.logWebhookRequest(
        tenantId,
        'lead_capture',
        {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: body.substring(0, 1000), // Limit body size in logs
          ip: clientIp,
          userAgent
        },
        { status: 400, body: { error: 'Invalid JSON payload' } },
        false,
        Date.now() - startTime,
        'JSON parsing failed'
      )

      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Get webhook configuration for this tenant
    let webhookConfig
    try {
      webhookConfig = await getWebhookConfig(tenantId)
    } catch (error) {
      await webhookLogger?.logWebhookRequest(
        tenantId,
        'lead_capture',
        {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: payload,
          ip: clientIp,
          userAgent
        },
        { status: 404, body: { error: 'Webhook not configured' } },
        false,
        Date.now() - startTime,
        'Webhook configuration not found'
      )

      return NextResponse.json(
        { error: 'Webhook not configured for this tenant' },
        { status: 404 }
      )
    }

    // Rate limiting check
    const rateLimiter = new WebhookRateLimit()
    const rateCheck = await rateLimiter.checkRateLimit(
      tenantId,
      clientIp,
      webhookConfig.rate_limit_per_minute
    )

    if (!rateCheck.allowed) {
      await webhookLogger?.logWebhookRequest(
        tenantId,
        'lead_capture',
        {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: payload,
          ip: clientIp,
          userAgent
        },
        { 
          status: 429, 
          body: { 
            error: 'Rate limit exceeded',
            resetTime: rateCheck.resetTime
          }
        },
        false,
        Date.now() - startTime,
        'Rate limit exceeded'
      )

      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again after ${rateCheck.resetTime.toISOString()}`,
          resetTime: rateCheck.resetTime.toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': webhookConfig.rate_limit_per_minute.toString(),
            'X-RateLimit-Remaining': rateCheck.remaining.toString(),
            'X-RateLimit-Reset': rateCheck.resetTime.getTime().toString()
          }
        }
      )
    }

    // Signature validation
    let signatureValid = false
    if (signature) {
      signatureValid = validateWebhookSignature(
        body,
        signature,
        webhookConfig.webhook_secret
      )

      if (!signatureValid) {
        await webhookLogger?.logWebhookRequest(
          tenantId,
          'lead_capture',
          {
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: payload,
            ip: clientIp,
            userAgent
          },
          { status: 401, body: { error: 'Invalid webhook signature' } },
          false,
          Date.now() - startTime,
          'Invalid signature'
        )

        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    } else {
      // Log warning about missing signature
      console.warn(`Webhook received without signature from IP: ${clientIp}`)
    }

    // Validate and sanitize input data
    const validation = WebhookValidator.validateLeadData(payload)
    if (!validation.isValid) {
      await webhookLogger?.logWebhookRequest(
        tenantId,
        'lead_capture',
        {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: payload,
          ip: clientIp,
          userAgent
        },
        { 
          status: 400, 
          body: { 
            error: 'Validation failed',
            details: validation.errors
          }
        },
        signatureValid,
        Date.now() - startTime,
        `Validation failed: ${validation.errors.join(', ')}`
      )

      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Transform payload to lead format
    const leadData = transformToLead(validation.sanitized, tenantId)

    // Save lead to database
    const { data: newLead, error: dbError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating lead:', dbError)
      
      await webhookLogger?.logWebhookRequest(
        tenantId,
        'lead_capture',
        {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: payload,
          ip: clientIp,
          userAgent
        },
        { status: 500, body: { error: 'Database error' } },
        signatureValid,
        Date.now() - startTime,
        `Database error: ${dbError.message}`
      )

      return NextResponse.json(
        { 
          error: 'Failed to save lead',
          message: 'Database error occurred'
        },
        { status: 500 }
      )
    }

    // Success response
    const responseBody = {
      success: true,
      message: 'Lead created successfully',
      leadId: newLead.id,
      data: {
        company: newLead.company_name,
        contact: newLead.contact_name,
        email: newLead.email,
        source: newLead.source,
        status: newLead.status
      }
    }

    // Log successful webhook
    await webhookLogger?.logWebhookRequest(
      tenantId,
      'lead_capture',
      {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: payload,
        ip: clientIp,
        userAgent
      },
      { status: 201, body: responseBody },
      signatureValid,
      Date.now() - startTime
    )

    return NextResponse.json(responseBody, { 
      status: 201,
      headers: {
        'X-RateLimit-Limit': webhookConfig.rate_limit_per_minute.toString(),
        'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        'X-RateLimit-Reset': rateCheck.resetTime.getTime().toString()
      }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Log error if possible
    if (webhookLogger && tenantId) {
      await webhookLogger.logWebhookRequest(
        tenantId,
        'lead_capture',
        {
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: 'Error occurred before body parsing',
          ip: clientIp,
          userAgent: request.headers.get('user-agent') || 'unknown'
        },
        { status: 500, body: { error: 'Internal server error' } },
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook info and testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant')

  if (!tenantId) {
    return NextResponse.json({
      error: 'Missing tenant parameter',
      message: 'Include ?tenant=YOUR_TENANT_ID in the URL'
    }, { status: 400 })
  }

  try {
    const webhookConfig = await getWebhookConfig(tenantId)
    
    return NextResponse.json({
      message: 'Webhook endpoint is active and configured',
      tenant: tenantId,
      endpoint: `/api/webhook/leads?tenant=${tenantId}`,
      method: 'POST',
      contentType: 'application/json',
      authentication: 'X-Webhook-Signature header required',
      rateLimit: `${webhookConfig.rate_limit_per_minute} requests per minute`,
      requiredFields: ['name', 'email'],
      optionalFields: ['phone', 'company', 'message', 'source', 'website', 'metadata'],
      example: {
        name: 'Jan Janssen',
        email: 'jan@bakkerijjanssen.nl',
        phone: '+31 6 1234 5678',
        company: 'Bakkerij Janssen',
        message: 'Interested in air conditioning for my bakery',
        source: 'website_contact_form',
        metadata: {
          form_version: '2.1',
          utm_source: 'google',
          utm_campaign: 'summer2024'
        }
      },
      signatureGeneration: {
        algorithm: 'HMAC-SHA256',
        secret: 'Use your webhook secret from the settings page',
        header: 'X-Webhook-Signature',
        format: 'sha256=HEXDIGEST'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Webhook not configured',
      message: 'This tenant does not have webhook configuration set up'
    }, { status: 404 })
  }
}