import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'
import { mapDatabaseContactToContact, prepareContactForDatabase } from '@/lib/contacts-helpers'

// GET /api/contacts - Get all contacts
export async function GET(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const searchParams = request.nextUrl.searchParams
    
    // Get filters from query params
    const status = searchParams.get('status')
    const relationship_status = searchParams.get('relationship_status')
    const temperature = searchParams.get('temperature')
    const search = searchParams.get('search')
    const company_id = searchParams.get('company_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // SECURITY: Always filter by authenticated tenant
    query = query.eq('tenant_id', tenantId)
    
    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (relationship_status) {
      query = query.eq('relationship_status', relationship_status)
    }
    if (temperature) {
      query = query.eq('temperature', temperature)
    }
    if (company_id) {
      query = query.eq('company_id', company_id)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company_name.ilike.%${search}%`)
    }
    
    const { data: contacts, error, count } = await query
    
    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }
    
    // Map database contacts to application format
    const mappedContacts = (contacts || []).map(mapDatabaseContactToContact);
    
    return NextResponse.json({
      contacts: mappedContacts,
      total: count || 0,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Error in GET /api/contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const body = await request.json()
    
    // Prepare contact data
    const contactData = {
      ...body,
      tenant_id: tenantId,
      status: body.status || 'active',
      relationship_status: body.relationship_status || 'prospect',
      country: body.country || 'Nederland'
    }
    
    // Prepare for database (handles column name mapping)
    const dbData = prepareContactForDatabase(contactData);
    
    // Create contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([dbData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }
    
    // If converting from lead, update lead status
    if (body.lead_id) {
      await supabase
        .from('leads')
        .update({ 
          status: 'converted',
          converted_to_contact_at: new Date().toISOString(),
          contact_id: contact.id
        })
        .eq('id', body.lead_id)
    }
    
    // Map to application format
    const mappedContact = mapDatabaseContactToContact(contact);
    
    return NextResponse.json({ contact: mappedContact }, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}