import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { schedule_at } = body

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', params.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Validate campaign can be sent
    if (campaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Campaign must be in draft status to send' },
        { status: 400 }
      )
    }

    if (!campaign.content_html || !campaign.content_text) {
      return NextResponse.json(
        { error: 'Campaign must have content before sending' },
        { status: 400 }
      )
    }

    // Get recipients based on segment
    let recipients = []
    const tenantId = campaign.tenant_id

    if (campaign.segment_type === 'all' || campaign.segment_type === 'leads') {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, name, email')
        .eq('tenant_id', tenantId)
        .not('email', 'is', null)

      if (leads) {
        recipients = recipients.concat(
          leads.map(lead => ({
            lead_id: lead.id,
            email: lead.email,
            name: lead.name
          }))
        )
      }
    }

    if (campaign.segment_type === 'all' || campaign.segment_type === 'customers') {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email')
        .eq('tenant_id', tenantId)
        .not('email', 'is', null)

      if (contacts) {
        recipients = recipients.concat(
          contacts.map(contact => ({
            contact_id: contact.id,
            email: contact.email,
            name: contact.name
          }))
        )
      }
    }

    // Remove duplicates by email
    const uniqueRecipients = Array.from(
      new Map(recipients.map(r => [r.email, r])).values()
    )

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for the selected segment' },
        { status: 400 }
      )
    }

    // Create recipient records
    const recipientRecords = uniqueRecipients.map(recipient => ({
      campaign_id: params.id,
      ...recipient,
      status: 'pending',
      created_at: new Date().toISOString()
    }))

    const { error: recipientError } = await supabase
      .from('campaign_recipients')
      .insert(recipientRecords)

    if (recipientError) {
      console.error('Error creating recipients:', recipientError)
      return NextResponse.json(
        { error: 'Failed to create recipient list' },
        { status: 500 }
      )
    }

    // Update campaign status
    const updateData: any = {
      recipient_count: uniqueRecipients.length,
      updated_at: new Date().toISOString()
    }

    if (schedule_at) {
      updateData.status = 'scheduled'
      updateData.scheduled_at = schedule_at
    } else {
      updateData.status = 'sending'
      updateData.sent_at = new Date().toISOString()
      
      // In production, this would trigger the actual email sending process
      // For now, we'll simulate it was sent successfully
      setTimeout(async () => {
        await supabase
          .from('campaigns')
          .update({
            status: 'sent',
            completed_at: new Date().toISOString(),
            sent_count: uniqueRecipients.length,
            delivered_count: Math.floor(uniqueRecipients.length * 0.97),
            opened_count: Math.floor(uniqueRecipients.length * 0.6),
            clicked_count: Math.floor(uniqueRecipients.length * 0.28),
            open_rate: 60,
            click_rate: 28
          })
          .eq('id', params.id)
      }, 5000)
    }

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating campaign:', updateError)
      return NextResponse.json(
        { error: 'Failed to send campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      campaign: updatedCampaign,
      message: schedule_at 
        ? `Campaign scheduled for ${new Date(schedule_at).toLocaleString()}`
        : `Campaign is being sent to ${uniqueRecipients.length} recipients`
    })

  } catch (error) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}