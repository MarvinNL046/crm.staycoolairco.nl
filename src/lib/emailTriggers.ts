import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']

// Function to trigger welcome email for new leads
export const triggerWelcomeEmail = async (lead: Lead) => {
  // Only send if lead has email and is new
  if (!lead.email || lead.status !== 'new') return

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId: lead.id,
        tenantId: lead.tenant_id,
        type: 'welcome',
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Failed to send welcome email:', result.error)
    } else {
      console.log('Welcome email sent successfully:', result.messageId)
    }
  } catch (error) {
    console.error('Error triggering welcome email:', error)
  }
}

// Function to trigger status change email
export const triggerStatusChangeEmail = async (leadId: string, tenantId: string, oldStatus: string, newStatus: string) => {
  // Don't send email for initial status (new)
  if (oldStatus === 'new' || oldStatus === newStatus) return

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId,
        tenantId,
        type: 'status_change',
        oldStatus,
        newStatus,
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Failed to send status change email:', result.error)
    } else {
      console.log('Status change email sent successfully:', result.messageId)
    }
  } catch (error) {
    console.error('Error triggering status change email:', error)
  }
}