import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// Create a Supabase client with service role key for API operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GoHighLevel webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log voor debugging (verwijder in productie)
    console.log('GHL Webhook received:', JSON.stringify(body, null, 2))
    
    // Extract tenant_id van query parameter of header
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant_id') || 
                     request.headers.get('x-tenant-id') ||
                     body.tenant_id

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required in query parameter' },
        { status: 400 }
      )
    }

    // Map GHL fields naar onze database structuur
    // GHL stuurt meestal: first_name, last_name, email, phone, etc.
    const leadData = {
      tenant_id: tenantId,
      name: `${body.first_name || ''} ${body.last_name || ''}`.trim() || 
            body.full_name || 
            body.name || 
            'Onbekend',
      email: body.email || body.contact_email || null,
      phone: body.phone || body.contact_phone || body.mobile || null,
      company: body.company || body.company_name || null,
      source: body.source || 'ghl_webhook',
      status: 'new' as const,
      notes: body.notes || body.message || null,
      tags: extractTags(body),
    }

    // Insert lead
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error('Error creating lead from GHL:', error)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Return success response (GHL expects 200 OK)
    return NextResponse.json(
      { 
        success: true,
        lead_id: data.id,
        message: 'Lead successfully created from GHL webhook'
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('GHL webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Extract tags from GHL data
function extractTags(body: any): string[] {
  const tags: string[] = []
  
  // GHL tags kunnen in verschillende formaten komen
  if (body.tags) {
    if (Array.isArray(body.tags)) {
      tags.push(...body.tags)
    } else if (typeof body.tags === 'string') {
      tags.push(...body.tags.split(',').map((t: string) => t.trim()))
    }
  }
  
  // Voeg form/campaign info toe als tag
  if (body.form_name) tags.push(`form:${body.form_name}`)
  if (body.campaign_name) tags.push(`campaign:${body.campaign_name}`)
  if (body.utm_source) tags.push(`utm:${body.utm_source}`)
  
  return tags.filter(Boolean)
}

// OPTIONS request voor CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-tenant-id',
    },
  })
}