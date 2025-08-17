import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tasks - List all tasks with filtering and assignment
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // pending, in_progress, completed, cancelled
    const priority = searchParams.get('priority'); // low, medium, high, urgent
    const assignedTo = searchParams.get('assignedTo');
    const customerId = searchParams.get('customerId');
    const dealId = searchParams.get('dealId');
    const dueDate = searchParams.get('dueDate'); // today, overdue, week, month
    const sortBy = searchParams.get('sortBy') || 'due_date';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query with relationships
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:users(id, name, email),
        customer:customers(id, name, company),
        deal:deals(id, title),
        created_by:users!created_by(id, name)
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    // Apply due date filters
    if (dueDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (dueDate) {
        case 'today':
          query = query.gte('due_date', today.toISOString())
                      .lt('due_date', tomorrow.toISOString());
          break;
        case 'overdue':
          query = query.lt('due_date', now.toISOString())
                      .neq('status', 'completed');
          break;
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          query = query.gte('due_date', today.toISOString())
                      .lt('due_date', weekEnd.toISOString());
          break;
        case 'month':
          const monthEnd = new Date(today);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          query = query.gte('due_date', today.toISOString())
                      .lt('due_date', monthEnd.toISOString());
          break;
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Calculate task statistics
    let statistics = {};
    if (page === 1) { // Only calculate on first page
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('status, priority, due_date');

      if (allTasks) {
        const now = new Date();
        statistics = {
          total: allTasks.length,
          byStatus: {
            pending: allTasks.filter((t: any) => t.status === 'pending').length,
            in_progress: allTasks.filter((t: any) => t.status === 'in_progress').length,
            completed: allTasks.filter((t: any) => t.status === 'completed').length,
            cancelled: allTasks.filter((t: any) => t.status === 'cancelled').length
          },
          byPriority: {
            urgent: allTasks.filter((t: any) => t.priority === 'urgent').length,
            high: allTasks.filter((t: any) => t.priority === 'high').length,
            medium: allTasks.filter((t: any) => t.priority === 'medium').length,
            low: allTasks.filter((t: any) => t.priority === 'low').length
          },
          overdue: allTasks.filter((t: any) => 
            t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
          ).length
        };
      }
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      statistics
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
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

    // Create task with default values
    const taskData = {
      title: body.title,
      description: body.description || null,
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      reminder_date: body.reminder_date || null,
      assigned_to: body.assigned_to || null,
      customer_id: body.customer_id || null,
      contact_id: body.contact_id || null,
      deal_id: body.deal_id || null,
      type: body.type || 'general', // general, call, email, meeting, follow-up
      tags: body.tags || [],
      attachments: body.attachments || [],
      created_by: body.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}