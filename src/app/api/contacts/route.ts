import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/contacts - List all contacts with search, filter, and pagination
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customerId');
    const tags = searchParams.get('tags');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query with customer relationship
    let query = supabase
      .from('contacts')
      .select(`
        *,
        customer:customers(id, name, company)
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply customer filter
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    // Apply tags filter
    if (tags) {
      const tagArray = tags.split(',');
      query = query.contains('tags', tagArray);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['first_name', 'email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

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

    // Create contact with default values
    const contactData = {
      first_name: body.first_name,
      last_name: body.last_name || null,
      email: body.email,
      phone: body.phone || null,
      customer_id: body.customer_id || null,
      position: body.position || null,
      department: body.department || null,
      status: body.status || 'active',
      tags: body.tags || [],
      notes: body.notes || null,
      social_media: body.social_media || {},
      preferences: body.preferences || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select(`
        *,
        customer:customers(id, name, company)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}