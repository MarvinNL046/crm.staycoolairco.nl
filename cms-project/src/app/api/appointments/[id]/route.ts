import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/appointments/[id] - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    // Extract only the fields we want to update
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that are present in the request
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.all_day !== undefined) updateData.all_day = body.all_day;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.lead_id !== undefined) updateData.lead_id = body.lead_id;
    if (body.contact_id !== undefined) updateData.contact_id = body.contact_id;
    if (body.customer_id !== undefined) updateData.customer_id = body.customer_id;
    if (body.reminder_minutes !== undefined) updateData.reminder_minutes = body.reminder_minutes;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.outcome !== undefined) updateData.outcome = body.outcome;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      appointment,
      message: 'Appointment updated successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] - Partial update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Appointment deleted successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}