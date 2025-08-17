import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/deals/[id] - Get a single deal with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        customer:customers(id, name, company, email, phone),
        contact:contacts(id, first_name, last_name, email, phone),
        assigned_user:users(id, name, email)
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

// PUT /api/deals/[id] - Update a deal
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

    // Validate contact exists if provided
    if (body.contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', body.contact_id)
        .single();

      if (contactError || !contact) {
        return NextResponse.json(
          { error: 'Invalid contact ID' },
          { status: 400 }
        );
      }
    }

    // Add updated_at timestamp
    body.updated_at = new Date().toISOString();

    // Track stage changes for activity log
    const { data: currentDeal } = await supabase
      .from('deals')
      .select('stage, status')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('deals')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name, company),
        contact:contacts(id, first_name, last_name, email),
        assigned_user:users(id, name, email)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log stage change activity if stage changed
    if (currentDeal && body.stage && currentDeal.stage !== body.stage) {
      const activity = {
        type: 'stage_change',
        from: currentDeal.stage,
        to: body.stage,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('deals')
        .update({ 
          activities: [...(data.activities || []), activity] 
        })
        .eq('id', id);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] - Delete a deal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if deal exists
    const { data: deal, error: checkError } = await supabase
      .from('deals')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Delete deal
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}