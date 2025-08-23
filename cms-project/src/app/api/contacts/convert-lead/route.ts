import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// POST /api/contacts/convert-lead - Convert a lead to a contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, additional_data, tenant_id } = body
    
    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }
    
    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()
    
    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    
    // Check if lead is already converted
    if (lead.status === 'converted' || lead.contact_id) {
      return NextResponse.json({ error: 'Lead already converted' }, { status: 400 })
    }
    
    // Create contact from lead data
    const contactData = {
      tenant_id: tenant_id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company,
      source: lead.source,
      notes: lead.notes,
      lead_id: lead.id,
      converted_from_lead_at: new Date().toISOString(),
      status: 'active',
      relationship_status: 'customer',
      temperature: 'warm',
      ...additional_data // Allow overriding or adding additional fields
    }
    
    // Create contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single()
    
    if (contactError) {
      console.error('Error creating contact:', contactError)
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }
    
    // Update lead status
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        status: 'converted',
        converted_to_contact_at: new Date().toISOString(),
        contact_id: contact.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id)
    
    if (updateError) {
      console.error('Error updating lead:', updateError)
      // Continue anyway, contact was created successfully
    }
    
    // Transfer appointments from lead to contact
    await supabase
      .from('appointments')
      .update({ 
        contact_id: contact.id,
        lead_id: null
      })
      .eq('lead_id', lead_id)
    
    return NextResponse.json({ 
      contact,
      message: 'Lead successfully converted to contact'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/contacts/convert-lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}