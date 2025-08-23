// Webhook endpoint voor externe workflow triggers
// Bijvoorbeeld: externe forms, Zapier, Make.com, etc.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Verify webhook signature (optional maar recommended)
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);
    
    // Get webhook key from URL params
    const { searchParams } = new URL(request.url);
    const webhookKey = searchParams.get('key');
    
    if (!webhookKey) {
      return NextResponse.json({ error: 'Webhook key required' }, { status: 401 });
    }
    
    // Optional: verify signature
    const signature = request.headers.get('x-webhook-signature');
    if (signature && process.env.WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(body, signature, process.env.WEBHOOK_SECRET);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    const supabase = await createClient();
    
    // Find workflows that match this webhook trigger
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .contains('config', {
        nodes: [{
          type: 'trigger',
          data: {
            type: 'webhook',
            webhook_key: webhookKey
          }
        }]
      });
      
    if (error || !workflows || workflows.length === 0) {
      return NextResponse.json({ 
        error: 'No active workflows found for this webhook' 
      }, { status: 404 });
    }
    
    // Get headers once before mapping
    const headersList = await headers();
    const headerEntries = Object.fromEntries(headersList.entries());
    
    // Queue workflow executions
    const queuePromises = workflows.map((workflow: any) => 
      supabase
        .from('workflow_trigger_queue')
        .insert({
          workflow_id: workflow.id,
          trigger_type: 'webhook',
          trigger_data: {
            webhook_data: data,
            webhook_key: webhookKey,
            headers: headerEntries,
            triggered_at: new Date().toISOString()
          }
        })
    );
    
    const results = await Promise.allSettled(queuePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    return NextResponse.json({
      message: 'Webhook received',
      workflows_triggered: successful,
      data_received: data
    });
    
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint voor webhook testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({
      message: 'Workflow Webhook Endpoint',
      usage: 'POST /api/webhooks/workflow?key=YOUR_WEBHOOK_KEY',
      test_command: 'curl -X POST -H "Content-Type: application/json" -d \'{"test": true}\' YOUR_URL/api/webhooks/workflow?key=YOUR_KEY'
    });
  }
  
  // Test if webhook key exists
  const supabase = await createClient();
  const { data: workflows } = await supabase
    .from('workflows')
    .select('name')
    .eq('is_active', true)
    .contains('config', {
      nodes: [{
        type: 'trigger',
        data: {
          type: 'webhook',
          webhook_key: key
        }
      }]
    });
    
  if (workflows && workflows.length > 0) {
    return NextResponse.json({
      status: 'ready',
      webhook_key: key,
      workflows: workflows.map((w: any) => w.name),
      message: 'This webhook is configured and ready to receive data'
    });
  }
  
  return NextResponse.json({
    status: 'not_found',
    webhook_key: key,
    message: 'No active workflows found for this webhook key'
  }, { status: 404 });
}