import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

// GET /api/appointments - Get all appointments
export async function GET(request: NextRequest) {
  // Check if we're on localhost for development
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  if (isLocalhost) {
    // Return mock data for localhost
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return NextResponse.json([
      {
        id: '1',
        title: 'Meeting with John Doe',
        description: 'Discuss project requirements',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location: 'Office',
        customer_name: 'John Doe',
        tenant_id: 'localhost-tenant'
      },
      {
        id: '2',
        title: 'Site visit',
        description: 'Installation inspection',
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Customer location',
        customer_name: 'Jane Smith',
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
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('appointments')
      .select('*')
      .eq('tenant_id', tenantId) // SECURITY: Use authenticated tenant only
      .order('start_time', { ascending: true });

    // Add date filters if provided
    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({ appointments: appointments || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId, user } = authResult;

  try {
    const body = await request.json();
    const { 
      title,
      description,
      location,
      start_time,
      end_time,
      all_day,
      type,
      color,
      lead_id,
      contact_id,
      customer_id,
      reminder_minutes,
      notes
    } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, start_time, end_time' 
      }, { status: 400 });
    }

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId, // SECURITY: Use authenticated tenant only
        created_by: user.id, // SECURITY: Use authenticated user ID
        title,
        description,
        location,
        start_time,
        end_time,
        all_day: all_day || false,
        type: type || 'meeting',
        color: color || '#3B82F6',
        lead_id,
        contact_id,
        customer_id,
        reminder_minutes,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      appointment,
      message: 'Appointment created successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}