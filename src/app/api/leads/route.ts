import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client with service role key for API operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
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
          source: 'api',
          user_id: request.headers.get('x-user-id') || 'unknown'
        }
      }),
    }).catch(err => console.error('Failed to trigger automation:', err))

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

export async function PATCH(request: NextRequest) {
  try {
    // Create a Supabase client with service role key for API operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const body = await request.json()
    const { id, tenant_id, ...updateData } = body
    
    if (!id || !tenant_id) {
      return NextResponse.json(
        { error: 'id and tenant_id are required' },
        { status: 400 }
      )
    }

    // Get current lead data before update
    const { data: currentLead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .single()

    if (fetchError || !currentLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Update lead
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    // Check if status changed and trigger automation
    if (updateData.status && updateData.status !== currentLead.status) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: 'status_changed',
          tenant_id: updatedLead.tenant_id,
          lead_id: updatedLead.id,
          old_data: { status: currentLead.status },
          new_data: { status: updatedLead.status, ...updatedLead },
          metadata: {
            source: 'api',
            user_id: request.headers.get('x-user-id') || 'unknown',
            changed_by: 'user'
          }
        }),
      }).catch(err => console.error('Failed to trigger status change automation:', err))
    }

    // Return success response
    return NextResponse.json(
      { 
        success: true,
        lead: updatedLead,
        message: 'Lead successfully updated'
      },
      { status: 200 }
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
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-tenant-id, x-user-id',
    },
  })
}