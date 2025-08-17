import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/appointments - List all appointments with calendar view support
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const view = searchParams.get('view') || 'list'; // list, day, week, month
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const contactId = searchParams.get('contactId');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status'); // scheduled, confirmed, cancelled, completed
    const type = searchParams.get('type'); // meeting, call, demo, consultation
    const sortBy = searchParams.get('sortBy') || 'start_time';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query with relationships
    let query = supabase
      .from('appointments')
      .select(`
        *,
        assigned_user:users(id, name, email),
        customer:customers(id, name, company),
        contact:contacts(id, first_name, last_name, email),
        deal:deals(id, title),
        attendees:appointment_attendees(
          user:users(id, name, email),
          status
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    // Apply date range filter
    if (startDate && endDate) {
      query = query.gte('start_time', startDate)
                   .lte('end_time', endDate);
    } else if (view !== 'list') {
      // For calendar views, default to current period
      const now = new Date();
      let rangeStart, rangeEnd;

      switch (view) {
        case 'day':
          rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          rangeEnd = new Date(rangeStart);
          rangeEnd.setDate(rangeEnd.getDate() + 1);
          break;
        case 'week':
          rangeStart = new Date(now);
          rangeStart.setDate(now.getDate() - now.getDay());
          rangeEnd = new Date(rangeStart);
          rangeEnd.setDate(rangeEnd.getDate() + 7);
          break;
        case 'month':
          rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
          rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
      }

      if (rangeStart && rangeEnd) {
        query = query.gte('start_time', rangeStart.toISOString())
                     .lt('start_time', rangeEnd.toISOString());
      }
    }

    // Apply filters
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
    if (type) {
      query = query.eq('type', type);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination for list view
    if (view === 'list') {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Format response based on view type
    if (view === 'list') {
      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } else {
      // Calendar view format
      const calendarData = (data || []).map((appointment: any) => ({
        id: appointment.id,
        title: appointment.title,
        start: appointment.start_time,
        end: appointment.end_time,
        allDay: appointment.all_day || false,
        color: appointment.color || '#3b82f6',
        extendedProps: {
          description: appointment.description,
          location: appointment.location,
          customer: appointment.customer,
          contact: appointment.contact,
          status: appointment.status,
          type: appointment.type,
          attendees: appointment.attendees
        }
      }));

      return NextResponse.json({
        events: calendarData,
        view,
        total: count || 0
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'start_time', 'end_time'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate datetime
    const startTime = new Date(body.start_time);
    const endTime = new Date(body.end_time);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Validate relationships if provided
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

    // Check for conflicts (optional)
    if (body.check_conflicts && body.assigned_to) {
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id, title, start_time, end_time')
        .eq('assigned_to', body.assigned_to)
        .neq('status', 'cancelled')
        .or(`and(start_time.lt.${endTime.toISOString()},end_time.gt.${startTime.toISOString()})`);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Scheduling conflict detected',
            conflicts: conflicts
          },
          { status: 409 }
        );
      }
    }

    // Create appointment with default values
    const appointmentData = {
      title: body.title,
      description: body.description || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      all_day: body.all_day || false,
      location: body.location || null,
      virtual_meeting_link: body.virtual_meeting_link || null,
      type: body.type || 'meeting', // meeting, call, demo, consultation
      status: body.status || 'scheduled',
      assigned_to: body.assigned_to || null,
      customer_id: body.customer_id || null,
      contact_id: body.contact_id || null,
      deal_id: body.deal_id || null,
      // Reminder settings
      reminder_enabled: body.reminder_enabled !== false,
      reminder_minutes: body.reminder_minutes || 15,
      // Calendar sync
      google_event_id: body.google_event_id || null,
      outlook_event_id: body.outlook_event_id || null,
      // Other
      color: body.color || '#3b82f6',
      recurring: body.recurring || false,
      recurring_pattern: body.recurring_pattern || null,
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        assigned_user:users(id, name, email),
        customer:customers(id, name, company),
        contact:contacts(id, first_name, last_name, email),
        deal:deals(id, title)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Add attendees if provided
    if (body.attendees && Array.isArray(body.attendees)) {
      const attendeeRecords = body.attendees.map((userId: string) => ({
        appointment_id: data.id,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('appointment_attendees')
        .insert(attendeeRecords);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}