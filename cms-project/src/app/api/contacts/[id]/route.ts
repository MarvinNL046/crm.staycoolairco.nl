import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'
import { mapDatabaseContactToContact, prepareContactForDatabase } from '@/lib/contacts-helpers'

// GET /api/contacts/[id] - Get a single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    const { id } = await params
    
    // Fetch contact - SECURED: Filter by tenant
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
      console.error('Error fetching contact:', error)
      return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
    }
    
    // Map to application format
    const mappedContact = mapDatabaseContactToContact(contact);
    
    return NextResponse.json({ contact: mappedContact })
    
  } catch (error) {
    console.error('Error in GET /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    const { id } = await params
    const body = await request.json()
    
    // Prepare data for database
    const updateData = prepareContactForDatabase({
      ...body,
      updated_at: new Date().toISOString()
    });
    
    // Update contact - SECURED: Filter by tenant
    const { data: contact, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
      console.error('Error updating contact:', error)
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }
    
    // Map to application format
    const mappedContact = mapDatabaseContactToContact(contact);
    
    return NextResponse.json({ contact: mappedContact })
    
  } catch (error) {
    console.error('Error in PUT /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/contacts/[id] - Delete (archive) a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Authenticate user and get tenant
    const authResult = await authenticateApiRequest(request);
    if ('error' in authResult) {
      return createUnauthorizedResponse(authResult.error, authResult.status);
    }
    const { supabase, tenantId } = authResult;

    const { id } = await params
    
    // Archive contact instead of deleting - SECURED: Filter by tenant
    const { error } = await supabase
      .from('contacts')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
      console.error('Error archiving contact:', error)
      return NextResponse.json({ error: 'Failed to archive contact' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Contact archived successfully' })
    
  } catch (error) {
    console.error('Error in DELETE /api/contacts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}