import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema voor conversie data
const ConvertLeadSchema = z.object({
  // Address fields (optional during conversion)
  street: z.string().optional(),
  house_number: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default('Nederland'),
  
  // Additional contact fields
  position: z.string().optional(),
  department: z.string().optional(),
  
  // Conversion options
  archive_lead: z.boolean().default(false),
  update_references: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = ConvertLeadSchema.parse(body)

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Check if contact already exists with this email
    if (lead.email) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', lead.email)
        .eq('tenant_id', lead.tenant_id)
        .single()

      if (existingContact) {
        return NextResponse.json(
          { 
            error: 'Contact already exists with this email',
            existing_contact_id: existingContact.id 
          },
          { status: 409 }
        )
      }
    }

    // Start transaction
    const operations = []

    // Create contact from lead data
    const contactData = {
      tenant_id: lead.tenant_id,
      created_by: user.id,
      
      // Basic info from lead
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      
      // Address fields
      street: validatedData.street,
      house_number: validatedData.house_number,
      postal_code: validatedData.postal_code,
      city: validatedData.city,
      province: validatedData.province,
      country: validatedData.country,
      
      // Additional fields
      position: validatedData.position,
      department: validatedData.department,
      
      // Preserve data from lead
      source: lead.source || 'lead_conversion',
      notes: lead.notes,
      tags: lead.tags,
      
      // Set initial status
      status: 'active',
      
      // Metadata
      converted_from_lead_id: lead.id,
      converted_at: new Date().toISOString(),
    }

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (contactError) {
      return NextResponse.json(
        { error: 'Failed to create contact', details: contactError },
        { status: 500 }
      )
    }

    // Update references if requested
    if (validatedData.update_references) {
      // Update deals that reference this lead
      const { error: dealsError } = await supabase
        .from('deals')
        .update({ 
          contact_id: contact.id,
          lead_id: null 
        })
        .eq('lead_id', lead.id)

      if (dealsError) {
        console.error('Error updating deals:', dealsError)
      }

      // Update activities that reference this lead
      const { error: activitiesError } = await supabase
        .from('activities')
        .update({ 
          contact_id: contact.id,
          lead_id: null 
        })
        .eq('lead_id', lead.id)

      if (activitiesError) {
        console.error('Error updating activities:', activitiesError)
      }

      // Update tasks that reference this lead
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ 
          contact_id: contact.id,
          lead_id: null 
        })
        .eq('lead_id', lead.id)

      if (tasksError) {
        console.error('Error updating tasks:', tasksError)
      }
    }

    // Archive or update lead status
    if (validatedData.archive_lead) {
      // Archive the lead
      const { error: archiveError } = await supabase
        .from('leads')
        .update({ 
          status: 'won', // Use 'won' until 'converted' is added to enum
          converted_to_contact_id: contact.id,
          converted_at: new Date().toISOString(),
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (archiveError) {
        console.error('Error archiving lead:', archiveError)
      }
    } else {
      // Just update status to converted
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'won', // Use 'won' until 'converted' is added to enum
          converted_to_contact_id: contact.id,
          converted_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (updateError) {
        console.error('Error updating lead status:', updateError)
      }
    }

    // Create activity log
    await supabase
      .from('activities')
      .insert({
        tenant_id: lead.tenant_id,
        created_by: user.id,
        contact_id: contact.id,
        type: 'lead_converted',
        title: 'Lead geconverteerd naar contact',
        description: `Lead "${lead.name}" is geconverteerd naar een contact`,
        metadata: {
          lead_id: lead.id,
          contact_id: contact.id,
          converted_by: user.id
        }
      })

    // Return the created contact
    return NextResponse.json({
      success: true,
      contact,
      message: 'Lead successfully converted to contact'
    })

  } catch (error) {
    console.error('Error converting lead to contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}