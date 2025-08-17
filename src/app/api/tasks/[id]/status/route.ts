import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/tasks/[id]/status - Quick status update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, in_progress, completed, cancelled' },
        { status: 400 }
      );
    }

    // Get current task
    const { data: currentTask, error: fetchError } = await supabase
      .from('tasks')
      .select('status, title')
      .eq('id', id)
      .single();

    if (fetchError || !currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    // Add completed_at if completing
    if (body.status === 'completed' && currentTask.status !== 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Update task
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log activity
    await supabase
      .from('activities')
      .insert({
        type: 'task_status_change',
        task_id: id,
        description: `Task "${currentTask.title}" status changed from ${currentTask.status} to ${body.status}`,
        metadata: {
          from: currentTask.status,
          to: body.status
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      id: data.id,
      title: data.title,
      previousStatus: currentTask.status,
      newStatus: body.status,
      updated: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}