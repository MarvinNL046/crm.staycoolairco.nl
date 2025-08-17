import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/contacts/[id] - Get a single contact
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        customer:customers(id, name, company)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.created_at;

    // Validate customer exists if provided
    if (body.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', body.customer_id)
        .single();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: 'Invalid customer ID' },
          { status: 400 }
        );
      }
    }

    // Add updated_at timestamp
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('contacts')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name, company)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if contact exists
    const { data: contact, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Delete contact
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}