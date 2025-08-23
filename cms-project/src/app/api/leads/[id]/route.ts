import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/leads/[id] - Get single lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/leads/[id] - Update lead
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
    if (body.status !== undefined) updateData.status = body.status;
    if (body.retry_count !== undefined) updateData.retry_count = body.retry_count;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.archived !== undefined) updateData.archived = body.archived;
    if (body.archived_at !== undefined) updateData.archived_at = body.archived_at;

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      lead,
      message: 'Lead updated successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/leads/[id] - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Lead deleted successfully' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}