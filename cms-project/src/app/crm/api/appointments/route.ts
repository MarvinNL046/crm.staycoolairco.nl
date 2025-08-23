import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/appointments - Get all appointments
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenant_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('appointments')
      .select(`
        *,
        lead:leads(id, name, company),
        contact:contacts(id, name, company),
        customer:customers(id, name, company_name)
      `)
      .eq('tenant_id', tenantId)
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const body = await request.json();
    const { 
      tenant_id,
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

    if (!tenant_id || !title || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Missing required fields: tenant_id, title, start_time, end_time' 
      }, { status: 400 });
    }

    // Get current user ID (in a real app, this would come from auth)
    // For now, we'll use a placeholder
    const userId = '80496bff-b559-4b80-9102-3a84afdaa616'; // Same as tenant_id for testing

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id,
        created_by: userId,
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