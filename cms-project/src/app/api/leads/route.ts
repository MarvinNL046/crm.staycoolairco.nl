import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

// GET /api/leads - Get all leads
export async function GET(request: NextRequest) {
  // Check if we're on localhost for development
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  if (isLocalhost) {
    // Return mock data for localhost
    return NextResponse.json([
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+31612345678',
        company: 'ABC Company',
        status: 'new',
        source: 'website',
        notes: 'Interested in our services',
        created_at: new Date().toISOString(),
        tenant_id: 'localhost-tenant'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+31698765432',
        company: 'XYZ Corp',
        status: 'contacted',
        source: 'referral',
        notes: 'Follow up next week',
        created_at: new Date().toISOString(),
        tenant_id: 'localhost-tenant'
      }
    ])
  }

  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    // Build query - SECURITY: Use authenticated tenant ID only
    let query = supabase
      .from('leads')
      .select('*')
      .eq('archived', false)
      .eq('tenant_id', tenantId); // Only user's tenant data
    
    query = query.order('created_at', { ascending: false });

    // Apply filters if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (source) {
      query = query.eq('source', source);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Transform data to match frontend expectations
    const transformedLeads = leads?.map((lead: any) => ({
      id: lead.id,
      name: lead.name || 'Unknown',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      city: lead.city || '',
      status: lead.status || 'new',
      source: lead.source || 'Unknown',
      value: parseFloat(lead.value) || 0,
      contact: lead.name || 'Unknown', // For compatibility
      location: lead.city || '', // For compatibility
      assignedTo: lead.created_by || null, // Using created_by as assigned user
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      // Additional fields
      street: lead.street,
      house_number: lead.house_number,
      postal_code: lead.postal_code,
      province: lead.province,
      country: lead.country,
      notes: lead.notes,
      tags: lead.tags,
      retry_count: lead.retry_count || 0
    })) || [];

    return NextResponse.json({ 
      leads: transformedLeads,
      total: transformedLeads.length 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/leads - Create new lead
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId, user } = authResult;

  try {
    const body = await request.json();
    
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenantId, // SECURITY: Use authenticated tenant only
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        city: body.city,
        street: body.street,
        house_number: body.house_number,
        postal_code: body.postal_code,
        province: body.province,
        country: body.country || 'Nederland',
        status: body.status || 'new',
        source: body.source || 'Website',
        value: body.value || 0,
        notes: body.notes,
        tags: body.tags || [],
        created_by: user.id // SECURITY: Use authenticated user ID
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      lead,
      message: 'Lead created successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}