import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/deals - List all deals with filtering and pipeline view
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage');
    const customerId = searchParams.get('customerId');
    const contactId = searchParams.get('contactId');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minValue = searchParams.get('minValue');
    const maxValue = searchParams.get('maxValue');

    // Build query with relationships
    let query = supabase
      .from('deals')
      .select(`
        *,
        customer:customers(id, name, company),
        contact:contacts(id, first_name, last_name, email),
        assigned_user:users(id, name, email)
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply filters
    if (stage) {
      query = query.eq('stage', stage);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (contactId) {
      query = query.eq('contact_id', contactId);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (minValue) {
      query = query.gte('value', parseFloat(minValue));
    }
    if (maxValue) {
      query = query.lte('value', parseFloat(maxValue));
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

    // Calculate pipeline metrics
    let pipelineMetrics = {};
    if (!page || page === 1) {
      const { data: stageData } = await supabase
        .from('deals')
        .select('stage, value, status');
      
      if (stageData) {
        pipelineMetrics = stageData.reduce((acc: any, deal: any) => {
          if (!acc[deal.stage]) {
            acc[deal.stage] = {
              count: 0,
              totalValue: 0,
              wonCount: 0,
              lostCount: 0
            };
          }
          acc[deal.stage].count++;
          acc[deal.stage].totalValue += deal.value || 0;
          if (deal.status === 'won') acc[deal.stage].wonCount++;
          if (deal.status === 'lost') acc[deal.stage].lostCount++;
          return acc;
        }, {});
      }
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      pipelineMetrics
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create a new deal
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'customer_id', 'stage'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate customer exists
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

    // Create deal with default values
    const dealData = {
      title: body.title,
      description: body.description || null,
      customer_id: body.customer_id,
      contact_id: body.contact_id || null,
      stage: body.stage,
      value: body.value || 0,
      probability: body.probability || 0,
      expected_close_date: body.expected_close_date || null,
      status: body.status || 'open',
      assigned_to: body.assigned_to || null,
      tags: body.tags || [],
      notes: body.notes || null,
      custom_fields: body.custom_fields || {},
      activities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('deals')
      .insert(dealData)
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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}