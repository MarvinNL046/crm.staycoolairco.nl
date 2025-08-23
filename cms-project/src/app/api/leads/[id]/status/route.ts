import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// PATCH /api/leads/[id]/status - Update lead status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Update lead status
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead status:', error);
      console.error('Lead ID:', resolvedParams.id);
      console.error('Status:', status);
      return NextResponse.json({ 
        error: 'Failed to update lead status',
        details: error.message,
        leadId: resolvedParams.id,
        requestedStatus: status
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      lead: data,
      message: `Lead status updated to ${status}` 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}