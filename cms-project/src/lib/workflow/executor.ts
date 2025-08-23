// Workflow Execution Engine
// Dit draait server-side en voert workflow acties uit

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
const messagebird = require('messagebird');

// Initialize services lazily to avoid build-time issues
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key voor server-side
  );
}

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getMessageBirdClient() {
  return messagebird(process.env.MESSAGEBIRD_API_KEY);
}

// Types
interface WorkflowExecution {
  workflow_id: string;
  trigger_data: any;
  current_step: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  context: Record<string, any>;
}

interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Main executor class
export class WorkflowExecutor {
  async executeWorkflow(workflowId: string, triggerData: any) {
    console.log(`[Executor] Starting workflow ${workflowId}`, triggerData);
    
    // Get workflow definition
    const { data: workflow, error } = await getSupabaseClient()
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();
      
    if (error || !workflow) {
      console.error('[Executor] Workflow not found:', error);
      return;
    }
    
    // Create execution record
    const { data: execution, error: execError } = await getSupabaseClient()
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        trigger_data: triggerData,
        status: 'running',
        started_at: new Date().toISOString(),
        context: triggerData
      })
      .select()
      .single();
      
    if (execError || !execution) {
      console.error('[Executor] Failed to create execution:', execError);
      return;
    }
    
    // Execute each node in sequence
    const nodes = workflow.config.nodes || [];
    const edges = workflow.config.edges || [];
    
    let currentNodeId = nodes.find((n: any) => n.type === 'trigger')?.id;
    let context = { ...triggerData };
    
    while (currentNodeId) {
      const node = nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;
      
      // Execute node action
      const result = await this.executeNode(node, context, execution.id);
      
      if (!result.success) {
        await this.failExecution(execution.id, result.error || 'Unknown error');
        break;
      }
      
      // Update context with results
      context = { ...context, ...result.data };
      
      // Find next node
      const edge = edges.find((e: any) => e.source === currentNodeId);
      currentNodeId = edge?.target;
      
      // Handle wait nodes
      if (node.type === 'wait' && node.data?.delay) {
        await this.scheduleNextStep(execution.id, currentNodeId, node.data.delay, context);
        return; // Exit and resume later
      }
    }
    
    // Mark as completed
    await getSupabaseClient()
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', execution.id);
  }
  
  async executeNode(node: any, context: any, executionId: string): Promise<ActionResult> {
    console.log(`[Executor] Executing node ${node.id} (${node.type})`);
    
    switch (node.type) {
      case 'email':
        return await this.sendEmail(node.data, context);
        
      case 'sms':
        return await this.sendSMS(node.data, context);
        
      case 'task':
        return await this.createTask(node.data, context);
        
      case 'update-lead':
        return await this.updateLead(node.data, context);
        
      case 'condition':
        return await this.evaluateCondition(node.data, context);
        
      case 'webhook':
        return await this.callWebhook(node.data, context);
        
      default:
        return { success: true };
    }
  }
  
  // Action implementations
  async sendEmail(data: any, context: any): Promise<ActionResult> {
    try {
      const html = this.replaceVariables(data.body || '', context);
      const subject = this.replaceVariables(data.subject || '', context);
      
      const result = await getResendClient().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        to: context.lead?.email || data.to,
        subject,
        html
      });
      
      return { success: true, data: { emailId: result.data?.id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async sendSMS(data: any, context: any): Promise<ActionResult> {
    try {
      const message = this.replaceVariables(data.message || '', context);
      
      const result = await getMessageBirdClient().messages.create({
        originator: process.env.MESSAGEBIRD_ORIGINATOR || 'CRM',
        recipients: [context.lead?.phone || data.to],
        body: message
      });
      
      return { success: true, data: { messageId: result.id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async createTask(data: any, context: any): Promise<ActionResult> {
    try {
      const title = this.replaceVariables(data.title || '', context);
      const description = this.replaceVariables(data.description || '', context);
      
      const { error } = await getSupabaseClient()
        .from('tasks')
        .insert({
          title,
          description,
          priority: data.priority || 'medium',
          due_date: this.calculateDueDate(data.due_in),
          related_to: context.lead?.id,
          assigned_to: data.assigned_to
        });
        
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async updateLead(data: any, context: any): Promise<ActionResult> {
    try {
      const updates: any = {};
      
      if (data.status) updates.status = data.status;
      if (data.score_change) {
        const { data: lead } = await getSupabaseClient()
          .from('leads')
          .select('score')
          .eq('id', context.lead.id)
          .single();
          
        updates.score = (lead?.score || 0) + data.score_change;
      }
      
      const { error } = await getSupabaseClient()
        .from('leads')
        .update(updates)
        .eq('id', context.lead.id);
        
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async evaluateCondition(data: any, context: any): Promise<ActionResult> {
    try {
      const { field, operator, value } = data;
      const fieldValue = this.getNestedValue(context, field);
      
      let result = false;
      switch (operator) {
        case 'equals':
          result = fieldValue === value;
          break;
        case 'not_equals':
          result = fieldValue !== value;
          break;
        case 'contains':
          result = String(fieldValue).includes(value);
          break;
        case 'greater_than':
          result = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
          result = Number(fieldValue) < Number(value);
          break;
      }
      
      return { success: true, data: { conditionMet: result } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  async callWebhook(data: any, context: any): Promise<ActionResult> {
    try {
      const body = JSON.parse(this.replaceVariables(JSON.stringify(data.body || {}), context));
      
      const response = await fetch(data.url, {
        method: data.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...data.headers
        },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      
      return { success: response.ok, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  
  // Helper methods
  replaceVariables(text: string, context: any): string {
    return text.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      return this.getNestedValue(context, path.trim()) || match;
    });
  }
  
  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  calculateDueDate(dueIn: string): string {
    const now = new Date();
    const match = dueIn?.match(/(\d+)\s*(hours?|days?|weeks?)/);
    
    if (!match) return now.toISOString();
    
    const [, amount, unit] = match;
    const value = parseInt(amount);
    
    switch (unit.replace(/s$/, '')) {
      case 'hour':
        now.setHours(now.getHours() + value);
        break;
      case 'day':
        now.setDate(now.getDate() + value);
        break;
      case 'week':
        now.setDate(now.getDate() + (value * 7));
        break;
    }
    
    return now.toISOString();
  }
  
  async scheduleNextStep(executionId: string, nextNodeId: string, delay: string, context: any) {
    const runAt = this.calculateDueDate(delay);
    
    await getSupabaseClient()
      .from('workflow_scheduled_jobs')
      .insert({
        execution_id: executionId,
        next_node_id: nextNodeId,
        run_at: runAt,
        context
      });
  }
  
  async failExecution(executionId: string, error: string) {
    await getSupabaseClient()
      .from('workflow_executions')
      .update({
        status: 'failed',
        error,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);
  }
}

// Export singleton instance
export const workflowExecutor = new WorkflowExecutor();