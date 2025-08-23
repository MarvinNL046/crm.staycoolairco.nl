// API Route voor workflow execution
// Dit wordt aangeroepen door de queue processor of direct via webhooks

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { workflowExecutor } from '@/lib/workflow/executor';

// Queue processor - haalt pending triggers op en voert ze uit
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check service role auth (alleen server mag dit aanroepen)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes(process.env.WORKFLOW_SECRET_KEY!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Haal pending triggers op uit de queue
    const { data: triggers, error } = await supabase
      .from('workflow_trigger_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(10); // Process max 10 per keer
      
    if (error) {
      console.error('Failed to fetch triggers:', error);
      return NextResponse.json({ error: 'Failed to fetch triggers' }, { status: 500 });
    }
    
    // Process each trigger
    const results = await Promise.allSettled(
      triggers.map(async (trigger) => {
        // Mark als processing
        await supabase
          .from('workflow_trigger_queue')
          .update({ status: 'processing' })
          .eq('id', trigger.id);
          
        try {
          // Execute workflow
          await workflowExecutor.executeWorkflow(trigger.workflow_id, trigger.trigger_data);
          
          // Mark als completed
          await supabase
            .from('workflow_trigger_queue')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', trigger.id);
            
          return { triggerId: trigger.id, status: 'success' };
        } catch (error: any) {
          console.error(`Failed to execute workflow for trigger ${trigger.id}:`, error);
          
          // Update retry count
          await supabase
            .from('workflow_trigger_queue')
            .update({
              status: 'failed',
              retry_count: trigger.retry_count + 1,
              error: error.message
            })
            .eq('id', trigger.id);
            
          return { triggerId: trigger.id, status: 'failed', error: error.message };
        }
      })
    );
    
    // Process scheduled jobs (voor wait acties)
    const { data: scheduledJobs } = await supabase
      .rpc('get_ready_scheduled_jobs');
      
    if (scheduledJobs && scheduledJobs.length > 0) {
      await Promise.allSettled(
        scheduledJobs.map(async (job: any) => {
          try {
            // Resume workflow execution
            const { data: execution } = await supabase
              .from('workflow_executions')
              .select('*')
              .eq('id', job.execution_id)
              .single();
              
            if (execution) {
              // Continue workflow from next node
              // Dit zou de executor moeten updaten om vanaf een specifieke node te starten
              await workflowExecutor.executeWorkflow(
                execution.workflow_id,
                job.context
              );
            }
          } catch (error) {
            console.error(`Failed to resume execution ${job.execution_id}:`, error);
          }
        })
      );
    }
    
    return NextResponse.json({ 
      processed: results.length,
      results,
      scheduledJobs: scheduledJobs?.length || 0
    });
    
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Direct execution endpoint (voor testen of manual triggers)
export async function PUT(request: NextRequest) {
  try {
    const { workflowId, triggerData } = await request.json();
    
    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Check permissions
    const { data: workflow } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();
      
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    
    // Add to queue
    const { data, error } = await supabase
      .from('workflow_trigger_queue')
      .insert({
        workflow_id: workflowId,
        trigger_type: 'manual',
        trigger_data: triggerData || {}
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: 'Failed to queue workflow' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Workflow queued for execution',
      queueId: data.id 
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}