import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  sendSMS, 
  sendWhatsApp, 
  generateWelcomeSMS, 
  generateStatusChangeSMS,
  generateWhatsAppWelcome,
  generateWhatsAppStatusUpdate,
  formatPhoneNumber
} from '@/lib/messagebird'

interface MessageRequest {
  leadId: string
  tenantId: string
  type: 'welcome' | 'status_change'
  channel: 'sms' | 'whatsapp'
  oldStatus?: string
  newStatus?: string
  testMode?: boolean
  testPhone?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: MessageRequest = await request.json()
    const { leadId, tenantId, type, channel, oldStatus, newStatus, testMode, testPhone } = body

    // Validate required fields
    if (!leadId || !tenantId || !type || !channel) {
      return NextResponse.json({ 
        error: 'Missing required fields: leadId, tenantId, type, channel' 
      }, { status: 400 })
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ 
        error: 'Lead not found or access denied' 
      }, { status: 404 })
    }

    // Get tenant data for company name
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ 
        error: 'Tenant not found' 
      }, { status: 404 })
    }

    const companyName = tenant.name
    const phone = testMode ? testPhone : lead.phone

    // Validate phone number
    if (!phone) {
      return NextResponse.json({ 
        error: 'No phone number available for this lead' 
      }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(phone)

    let result

    if (channel === 'sms') {
      // Generate SMS content
      let message: string
      
      if (type === 'welcome') {
        message = generateWelcomeSMS(lead.name, companyName)
      } else if (type === 'status_change' && newStatus) {
        message = generateStatusChangeSMS(lead.name, newStatus, companyName)
      } else {
        return NextResponse.json({ 
          error: 'Invalid message type or missing status for status_change' 
        }, { status: 400 })
      }

      // Send SMS
      result = await sendSMS({
        to: formattedPhone,
        message,
        from: 'StayCool'
      })

    } else if (channel === 'whatsapp') {
      // Generate WhatsApp content
      let whatsappData
      
      if (type === 'welcome') {
        whatsappData = generateWhatsAppWelcome(lead.name, companyName)
      } else if (type === 'status_change' && newStatus) {
        whatsappData = generateWhatsAppStatusUpdate(lead.name, newStatus, companyName)
      } else {
        return NextResponse.json({ 
          error: 'Invalid message type or missing status for status_change' 
        }, { status: 400 })
      }

      // Send WhatsApp
      result = await sendWhatsApp({
        to: formattedPhone,
        message: whatsappData.message
      })

    } else {
      return NextResponse.json({ 
        error: 'Invalid channel. Must be "sms" or "whatsapp"' 
      }, { status: 400 })
    }

    // Log messaging activity in database (optional future feature)
    if (result.success && !testMode) {
      try {
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: leadId,
            tenant_id: tenantId,
            type: 'message_sent',
            description: `${channel.toUpperCase()} ${type} message sent`,
            metadata: {
              channel,
              messageType: type,
              messageId: result.messageId,
              phone: formattedPhone
            }
          })
      } catch (error) {
        console.error('Failed to log messaging activity:', error)
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      channel,
      type,
      phone: formattedPhone,
      testMode: !!testMode,
      result: result.result
    })

  } catch (error) {
    console.error('Messaging API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET request voor API info
export async function GET() {
  return NextResponse.json({
    service: 'StayCool CRM Messaging API',
    version: '1.0',
    channels: ['sms', 'whatsapp'],
    messageTypes: ['welcome', 'status_change'],
    documentation: {
      endpoint: '/api/messaging/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <supabase_token>'
      },
      required_fields: ['leadId', 'tenantId', 'type', 'channel'],
      optional_fields: ['oldStatus', 'newStatus', 'testMode', 'testPhone'],
      example_payload: {
        leadId: 'uuid',
        tenantId: 'uuid', 
        type: 'welcome',
        channel: 'sms'
      }
    }
  })
}