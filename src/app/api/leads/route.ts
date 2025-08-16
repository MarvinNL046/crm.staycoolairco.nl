import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

// Create a Supabase client with service role key for API operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract tenant_id from headers or body
    const tenantId = request.headers.get('x-tenant-id') || body.tenant_id
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenant_id is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Prepare lead data
    const leadData = {
      tenant_id: tenantId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      source: body.source || 'webform',
      status: 'new' as const,
      notes: body.notes || null,
      tags: body.tags || [],
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
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        lead_id: data.id,
        message: 'Lead successfully created'
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// OPTIONS request for CORS
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