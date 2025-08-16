import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import type { Database } from '@/types/database.types'

// StayCool CRM Webhook handler
export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client with service role key for API operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const body = await request.json()
    
    // Extract webhook key from header voor authenticatie
    const webhookKey = request.headers.get('x-webhook-key')
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json(
        { 
          error: 'Missing tenant_id',
          message: 'Add ?tenant_id=YOUR_TENANT_ID to the webhook URL'
        },
        { status: 400 }
      )
    }

    // Optioneel: valideer webhook key (later implementeren in tenant settings)
    if (webhookKey) {
      // TODO: Check webhook key tegen tenant settings
    }

    // Flexibele field mapping - accepteer verschillende veldnamen
    const leadData = {
      tenant_id: tenantId,
      name: extractName(body),
      email: extractEmail(body),
      phone: extractPhone(body),
      company: extractCompany(body),
      source: body.source || body._source || 'webhook',
      status: 'new' as const,
      notes: extractNotes(body),
      tags: extractTags(body),
    }

    // Validatie
    if (!leadData.name || leadData.name === 'Onbekend') {
      return NextResponse.json(
        { 
          error: 'Name is required',
          message: 'Please provide a name field (name, full_name, or first_name + last_name)'
        },
        { status: 400 }
      )
    }

    // Insert lead
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json(
        { error: 'Failed to create lead', details: error.message },
        { status: 500 }
      )
    }

    // Trigger automation for new lead
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger: 'lead_created',
        tenant_id: data.tenant_id,
        lead_id: data.id,
        new_data: data,
        metadata: {
          source: 'webhook',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      }),
    }).catch(err => console.error('Failed to trigger automation:', err))

    // Log webhook activity (voor debugging/monitoring)
    await logWebhookActivity(tenantId, 'success', body)

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        lead_id: data.id,
        message: 'Lead successfully created'
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Flexibele naam extractie
function extractName(body: any): string {
  // Check verschillende mogelijke veldnamen
  if (body.name) return body.name
  if (body.full_name) return body.full_name
  if (body.fullname) return body.fullname
  
  // Combineer first + last name
  const firstName = body.first_name || body.firstname || body.firstName || ''
  const lastName = body.last_name || body.lastname || body.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  
  return fullName || body.contact_name || body.contactName || 'Onbekend'
}

// Flexibele email extractie
function extractEmail(body: any): string | null {
  return body.email || 
         body.e_mail || 
         body.email_address || 
         body.emailAddress || 
         body.contact_email || 
         body.contactEmail || 
         null
}

// Flexibele telefoon extractie
function extractPhone(body: any): string | null {
  return body.phone || 
         body.telephone || 
         body.phone_number || 
         body.phoneNumber || 
         body.mobile || 
         body.mobileNumber || 
         body.contact_phone || 
         body.contactPhone || 
         null
}

// Flexibele bedrijfsnaam extractie
function extractCompany(body: any): string | null {
  return body.company || 
         body.company_name || 
         body.companyName || 
         body.organization || 
         body.business || 
         body.businessName || 
         null
}

// Combineer verschillende tekstvelden voor notes
function extractNotes(body: any): string | null {
  const notes: string[] = []
  
  // Voeg verschillende message velden toe
  if (body.message) notes.push(body.message)
  if (body.notes) notes.push(body.notes)
  if (body.comments) notes.push(body.comments)
  if (body.description) notes.push(body.description)
  
  // Voeg form metadata toe
  if (body.form_name) notes.push(`Formulier: ${body.form_name}`)
  if (body.page_url) notes.push(`Pagina: ${body.page_url}`)
  
  return notes.length > 0 ? notes.join('\n\n') : null
}

// Extract tags uit verschillende bronnen
function extractTags(body: any): string[] {
  const tags: string[] = []
  
  // Direct tags veld
  if (body.tags) {
    if (Array.isArray(body.tags)) {
      tags.push(...body.tags)
    } else if (typeof body.tags === 'string') {
      tags.push(...body.tags.split(',').map((t: string) => t.trim()))
    }
  }
  
  // UTM parameters als tags
  if (body.utm_source) tags.push(`utm:${body.utm_source}`)
  if (body.utm_medium) tags.push(`medium:${body.utm_medium}`)
  if (body.utm_campaign) tags.push(`campaign:${body.utm_campaign}`)
  
  // Form/page info als tags
  if (body.form_id) tags.push(`form:${body.form_id}`)
  if (body.page_name) tags.push(`page:${body.page_name}`)
  
  return tags.filter(Boolean)
}

// Log webhook activity voor monitoring
async function logWebhookActivity(tenantId: string, status: string, payload: any) {
  try {
    // Later kunnen we dit in een aparte tabel opslaan voor webhook logs
    console.log('Webhook activity:', { tenantId, status, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Error logging webhook activity:', error)
  }
}

// GET request voor webhook info/test
export async function GET(request: NextRequest) {
  return NextResponse.json({
    service: 'StayCool CRM Webhook',
    version: '1.0',
    documentation: {
      endpoint: '/api/webhook?tenant_id=YOUR_TENANT_ID',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-key': 'optional - for authentication'
      },
      accepted_fields: {
        required: ['name or (first_name + last_name)'],
        optional: [
          'email', 'phone', 'company', 'source', 'tags',
          'message', 'notes', 'utm_source', 'utm_medium', 'utm_campaign'
        ]
      },
      example_payload: {
        name: 'Jan Jansen',
        email: 'jan@example.com',
        phone: '+31612345678',
        company: 'Bedrijf BV',
        message: 'Ik ben geïnteresseerd in een airco installatie',
        tags: ['airco', 'installatie'],
        source: 'website-contact-form'
      }
    }
  })
}

// OPTIONS request voor CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-webhook-key',
    },
  })
}