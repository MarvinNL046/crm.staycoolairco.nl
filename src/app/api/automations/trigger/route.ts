import { NextRequest, NextResponse } from 'next/server'
import { processAutomationEvent, AutomationEvent } from '@/lib/automations'

// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Trigger automation events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { trigger, tenant_id, lead_id, new_data } = body
    
    if (!trigger || !tenant_id || !lead_id || !new_data) {
      return NextResponse.json({
        error: 'Missing required fields: trigger, tenant_id, lead_id, new_data'
      }, { status: 400 })
    }
    
    // Create automation event
    const event: AutomationEvent = {
      trigger,
      tenant_id,
      lead_id,
      user_id: body.user_id,
      old_data: body.old_data,
      new_data,
      metadata: body.metadata || {}
    }
    
    // Process automation event asynchronously
    // In production, you might want to queue this for background processing
    processAutomationEvent(event).catch(error => {
      console.error('Automation processing error:', error)
    })
    
    return NextResponse.json({
      success: true,
      message: 'Automation event triggered',
      event_id: `${trigger}_${lead_id}_${Date.now()}`
    })
    
  } catch (error) {
    console.error('Automation trigger error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}

// GET request for automation trigger documentation
export async function GET() {
  return NextResponse.json({
    service: 'StayCool CRM Automation Triggers',
    version: '1.0',
    supported_triggers: [
      'lead_created',
      'lead_updated', 
      'status_changed',
      'lead_assigned',
      'follow_up_due'
    ],
    supported_actions: [
      'send_email',
      'send_sms',
      'send_whatsapp', 
      'create_task',
      'update_status',
      'add_note'
    ],
    documentation: {
      endpoint: '/api/automations/trigger',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      required_fields: ['trigger', 'tenant_id', 'lead_id', 'new_data'],
      optional_fields: ['user_id', 'old_data', 'metadata'],
      example_payload: {
        trigger: 'lead_created',
        tenant_id: 'uuid',
        lead_id: 'uuid',
        user_id: 'uuid',
        new_data: {
          name: 'Jan Jansen',
          email: 'jan@example.com',
          phone: '+31612345678',
          status: 'new'
        },
        metadata: {
          source: 'webhook',
          ip_address: '192.168.1.1'
        }
      },
      status_change_example: {
        trigger: 'status_changed',
        tenant_id: 'uuid', 
        lead_id: 'uuid',
        old_data: { status: 'new' },
        new_data: { status: 'qualified' },
        metadata: { changed_by: 'user_id' }
      }
    }
  })
}