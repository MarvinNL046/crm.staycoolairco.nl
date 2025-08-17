import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/deals/[id]/stage - Update deal stage (for drag-drop pipeline)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    // Validate required fields
    if (!body.stage) {
      return NextResponse.json(
        { error: 'stage is required' },
        { status: 400 }
      );
    }

    // Get current deal data
    const { data: currentDeal, error: fetchError } = await supabase
      .from('deals')
      .select('stage, activities')
      .eq('id', id)
      .single();

    if (fetchError || !currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Create activity log entry
    const activity = {
      type: 'stage_change',
      from: currentDeal.stage,
      to: body.stage,
      timestamp: new Date().toISOString(),
      user_id: body.user_id || null,
      notes: body.notes || null
    };

    // Update deal with new stage and activity
    const updateData: any = {
      stage: body.stage,
      updated_at: new Date().toISOString(),
      activities: [...(currentDeal.activities || []), activity]
    };

    // Update probability based on stage if provided
    if (body.updateProbability && body.probability !== undefined) {
      updateData.probability = body.probability;
    }

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', id)
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

    return NextResponse.json({
      ...data,
      previousStage: currentDeal.stage,
      newStage: body.stage
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}