import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/appointments/[id] - Get a single appointment with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        assigned_user:users(id, name, email),
        customer:customers(id, name, company, email, phone),
        contact:contacts(id, first_name, last_name, email, phone),
        deal:deals(id, title, value, stage),
        attendees:appointment_attendees(
          user:users(id, name, email),
          status,
          responded_at
        )
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

// PUT /api/appointments/[id] - Update an appointment
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

    // Validate datetime if provided
    if (body.start_time || body.end_time) {
      const { data: currentAppointment } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('id', id)
        .single();

      const startTime = new Date(body.start_time || currentAppointment?.start_time);
      const endTime = new Date(body.end_time || currentAppointment?.end_time);

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

      body.start_time = startTime.toISOString();
      body.end_time = endTime.toISOString();
    }

    // Check for conflicts if rescheduling
    if ((body.start_time || body.end_time) && body.check_conflicts && body.assigned_to) {
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id, title, start_time, end_time')
        .eq('assigned_to', body.assigned_to)
        .neq('id', id)
        .neq('status', 'cancelled')
        .or(`and(start_time.lt.${body.end_time},end_time.gt.${body.start_time})`);

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

    // Add updated_at timestamp
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .update(body)
      .eq('id', id)
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

    // Update attendees if provided
    if (body.attendees && Array.isArray(body.attendees)) {
      // Remove existing attendees
      await supabase
        .from('appointment_attendees')
        .delete()
        .eq('appointment_id', id);

      // Add new attendees
      const attendeeRecords = body.attendees.map((userId: string) => ({
        appointment_id: id,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('appointment_attendees')
        .insert(attendeeRecords);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if appointment exists
    const { data: appointment, error: checkError } = await supabase
      .from('appointments')
      .select('id, title, status')
      .eq('id', id)
      .single();

    if (checkError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Delete appointment (attendees will be cascade deleted)
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // TODO: Send cancellation notifications to attendees

    return NextResponse.json({ 
      message: 'Appointment deleted successfully',
      deletedAppointment: appointment.title
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}