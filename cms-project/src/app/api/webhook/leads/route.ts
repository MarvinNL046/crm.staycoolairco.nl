import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

// Webhook payload interface
interface WebhookPayload {
  name: string
  email: string
  phone?: string
  company?: string
  message?: string
  source?: string
  website?: string
  // Additional fields
  [key: string]: any
}

// Webhook validation
function validateWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

// Transform webhook data to lead format
function transformToLead(payload: WebhookPayload) {
  // Extract company name from email domain if not provided
  const emailDomain = payload.email?.split('@')[1]
  const companyFromEmail = emailDomain ? 
    emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1) : 
    'Unknown Company'

  return {
    companyName: payload.company || companyFromEmail,
    contactName: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    website: payload.website || (emailDomain ? `https://${emailDomain}` : null),
    source: payload.source || 'WEBSITE',
    status: 'NEW',
    priority: 'MEDIUM',
    description: payload.message || 'Lead from contact form',
    notes: `Auto-imported from webhook\n\nOriginal payload:\n${JSON.stringify(payload, null, 2)}`,
    // Will be set by auth system when implemented
    createdById: 'system', // Placeholder
    assignedToId: null
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const signature = headersList.get('x-webhook-signature')
    const contentType = headersList.get('content-type')
    
    // Get raw body for signature validation
    const body = await request.text()
    
    // Parse JSON
    let payload: WebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON in webhook payload:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!payload.name || !payload.email) {
      return NextResponse.json(
        { error: 'Missing required fields: name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(payload.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Optional: Validate webhook signature (uncomment when implementing security)
    // const webhookSecret = process.env.WEBHOOK_SECRET
    // if (webhookSecret && signature) {
    //   if (!validateWebhookSignature(body, signature, webhookSecret)) {
    //     return NextResponse.json(
    //       { error: 'Invalid webhook signature' },
    //       { status: 401 }
    //     )
    //   }
    // }

    // Transform payload to lead format
    const leadData = transformToLead(payload)

    // Log the webhook for debugging
    console.log('Webhook received:', {
      timestamp: new Date().toISOString(),
      source: payload.source || 'unknown',
      email: payload.email,
      name: payload.name,
      ip: headersList.get('x-forwarded-for') || 'unknown'
    })

    // TODO: Save to database when Prisma is set up
    // const newLead = await prisma.lead.create({
    //   data: leadData
    // })

    // Simulate database save for now
    const mockLead = {
      id: Date.now(),
      ...leadData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('Lead created:', mockLead)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      leadId: mockLead.id,
      data: {
        company: mockLead.companyName,
        contact: mockLead.contactName,
        email: mockLead.email,
        source: mockLead.source,
        status: mockLead.status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process webhook'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Webhook endpoint is active',
    endpoint: '/api/webhook/leads',
    method: 'POST',
    contentType: 'application/json',
    requiredFields: ['name', 'email'],
    optionalFields: ['phone', 'company', 'message', 'source', 'website'],
    example: {
      name: 'Jan Janssen',
      email: 'jan@bakkerijjanssen.nl',
      phone: '+31 6 1234 5678',
      company: 'Bakkerij Janssen',
      message: 'Interested in air conditioning for my bakery',
      source: 'website_contact_form'
    }
  })
}