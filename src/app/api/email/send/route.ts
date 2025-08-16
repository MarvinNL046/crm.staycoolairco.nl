import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailViaResend, generateWelcomeEmail, generateStatusChangeEmail } from '@/lib/resend'
import type { Database } from '@/types/database.types'

// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Create a Supabase client with service role key for API operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()
    const { leadId, type, tenantId } = body

    if (!leadId || !type || !tenantId) {
      return NextResponse.json(
        { error: 'leadId, type, and tenantId are required' },
        { status: 400 }
      )
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (!lead.email) {
      return NextResponse.json(
        { error: 'Lead has no email address' },
        { status: 400 }
      )
    }

    // Get tenant details for company name
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    let emailContent
    let subject

    // Generate email content based on type
    switch (type) {
      case 'welcome':
        emailContent = generateWelcomeEmail(lead.name, tenant.name)
        subject = `Welkom bij ${tenant.name} - We nemen contact op!`
        break
      
      case 'status_change':
        const { oldStatus, newStatus } = body
        emailContent = generateStatusChangeEmail(lead.name, oldStatus, newStatus, tenant.name)
        subject = `Status update voor je aanvraag bij ${tenant.name}`
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    // Send email via Resend
    const emailResult = await sendEmailViaResend({
      to: lead.email,
      subject,
      html: emailContent.html,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      )
    }

    // Log the email in message_outbox for tracking
    await supabaseAdmin.from('message_outbox').insert({
      tenant_id: tenantId,
      lead_id: leadId,
      channel: 'email',
      to_address: lead.email,
      subject,
      body: emailContent.html,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      message: 'Email sent successfully',
    })

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}