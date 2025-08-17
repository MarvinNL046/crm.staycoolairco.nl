import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tasks/[id] - Get a single task with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:users(id, name, email),
        customer:customers(id, name, company, email, phone),
        contact:contacts(id, first_name, last_name, email),
        deal:deals(id, title, value, stage),
        created_by:users!created_by(id, name),
        comments:task_comments(
          id,
          content,
          created_at,
          user:users(id, name)
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

// PUT /api/tasks/[id] - Update a task
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
    delete body.created_by;

    // Get current task for activity logging
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('status, assigned_to')
      .eq('id', id)
      .single();

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

    if (body.deal_id) {
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('id')
        .eq('id', body.deal_id)
        .single();

      if (dealError || !deal) {
        return NextResponse.json(
          { error: 'Invalid deal ID' },
          { status: 400 }
        );
      }
    }

    // Add updated_at timestamp
    body.updated_at = new Date().toISOString();

    // Handle status completion
    if (body.status === 'completed' && currentTask?.status !== 'completed') {
      body.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        assigned_user:users(id, name, email),
        customer:customers(id, name, company),
        deal:deals(id, title),
        created_by:users!created_by(id, name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log activity if status or assignment changed
    if (currentTask) {
      const activities = [];
      
      if (body.status && currentTask.status !== body.status) {
        activities.push({
          type: 'status_change',
          task_id: id,
          from: currentTask.status,
          to: body.status,
          created_at: new Date().toISOString()
        });
      }

      if (body.assigned_to && currentTask.assigned_to !== body.assigned_to) {
        activities.push({
          type: 'assignment_change',
          task_id: id,
          from: currentTask.assigned_to,
          to: body.assigned_to,
          created_at: new Date().toISOString()
        });
      }

      if (activities.length > 0) {
        await supabase.from('activities').insert(activities);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if task exists
    const { data: task, error: checkError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete task (comments will be cascade deleted)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}