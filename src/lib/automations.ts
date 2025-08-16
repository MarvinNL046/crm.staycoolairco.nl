import { createClient } from '@/lib/supabase/server'

// Automation trigger types
export type AutomationTrigger = 
  | 'lead_created'
  | 'lead_updated' 
  | 'status_changed'
  | 'lead_assigned'
  | 'follow_up_due'

// Automation action types  
export type AutomationAction =
  | 'send_email'
  | 'send_sms'
  | 'send_whatsapp'
  | 'create_task'
  | 'update_status'
  | 'add_note'

// Automation rule configuration
export interface AutomationRule {
  id: string
  name: string
  description: string
  tenant_id: string
  trigger: AutomationTrigger
  conditions?: AutomationCondition[]
  actions: AutomationActionConfig[]
  enabled: boolean
  created_at: string
  updated_at: string
}

// Condition for automation triggers
export interface AutomationCondition {
  field: string // 'status', 'source', 'email', 'phone', etc.
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty'
  value?: string
}

// Action configuration
export interface AutomationActionConfig {
  id: string
  type: AutomationAction
  config: {
    // Email/SMS/WhatsApp configs
    channel?: 'email' | 'sms' | 'whatsapp'
    template?: string
    subject?: string
    delay_minutes?: number
    
    // Task creation config
    task_title?: string
    task_description?: string
    due_date_offset_days?: number
    
    // Status update config
    new_status?: string
    
    // Note config
    note_content?: string
  }
}

// Event payload for automation processing
export interface AutomationEvent {
  trigger: AutomationTrigger
  tenant_id: string
  lead_id: string
  user_id?: string
  old_data?: any
  new_data: any
  metadata?: Record<string, any>
}

// Default automation rules for new tenants
export const getDefaultAutomationRules = (tenantId: string): Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>[] => [
  {
    name: 'Welkom Email bij Nieuwe Lead',
    description: 'Verstuur automatisch een welkom email naar nieuwe leads met email adres',
    tenant_id: tenantId,
    trigger: 'lead_created',
    conditions: [
      { field: 'email', operator: 'is_not_empty' }
    ],
    actions: [
      {
        id: 'welcome_email',
        type: 'send_email',
        config: {
          channel: 'email',
          template: 'welcome',
          delay_minutes: 0
        }
      }
    ],
    enabled: true
  },
  
  {
    name: 'SMS bij Nieuw Lead met Telefoon',
    description: 'Verstuur automatisch een SMS naar nieuwe leads met telefoonnummer',
    tenant_id: tenantId,
    trigger: 'lead_created', 
    conditions: [
      { field: 'phone', operator: 'is_not_empty' },
      { field: 'email', operator: 'is_empty' } // Alleen SMS als geen email
    ],
    actions: [
      {
        id: 'welcome_sms',
        type: 'send_sms',
        config: {
          channel: 'sms',
          template: 'welcome',
          delay_minutes: 0
        }
      }
    ],
    enabled: true
  },

  {
    name: 'Status Change Notificatie',
    description: 'Verstuur bericht bij status wijziging naar qualified of hoger',
    tenant_id: tenantId,
    trigger: 'status_changed',
    conditions: [
      { field: 'new_status', operator: 'equals', value: 'qualified' }
    ],
    actions: [
      {
        id: 'status_notification',
        type: 'send_email',
        config: {
          channel: 'email',
          template: 'status_change',
          delay_minutes: 5
        }
      }
    ],
    enabled: true
  },

  {
    name: 'Follow-up Taak na 24 uur',
    description: 'Maak automatisch een follow-up taak 24 uur na nieuwe lead',
    tenant_id: tenantId,
    trigger: 'lead_created',
    conditions: [],
    actions: [
      {
        id: 'followup_task',
        type: 'create_task',
        config: {
          task_title: 'Follow-up nieuwe lead',
          task_description: 'Neem contact op met nieuwe lead binnen 24 uur',
          due_date_offset_days: 1
        }
      }
    ],
    enabled: false // Disabled by default
  },

  {
    name: 'WhatsApp bij Gewonnen Lead',
    description: 'Verstuur felicitatie WhatsApp bij gewonnen lead',
    tenant_id: tenantId,
    trigger: 'status_changed',
    conditions: [
      { field: 'new_status', operator: 'equals', value: 'won' },
      { field: 'phone', operator: 'is_not_empty' }
    ],
    actions: [
      {
        id: 'congratulations_whatsapp',
        type: 'send_whatsapp',
        config: {
          channel: 'whatsapp',
          template: 'congratulations',
          delay_minutes: 0
        }
      }
    ],
    enabled: true
  }
]

// Process automation event
export async function processAutomationEvent(event: AutomationEvent) {
  console.log('Processing automation event:', event)
  
  try {
    const supabase = await createClient()
    
    // Get automation rules for this tenant and trigger
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('tenant_id', event.tenant_id)
      .eq('trigger', event.trigger)
      .eq('enabled', true)
    
    if (error) {
      console.error('Error fetching automation rules:', error)
      return
    }

    if (!rules || rules.length === 0) {
      console.log('No automation rules found for trigger:', event.trigger)
      return
    }

    // Process each rule
    for (const rule of rules) {
      try {
        await processAutomationRule(rule, event)
      } catch (error) {
        console.error(`Error processing automation rule ${rule.id}:`, error)
        // Continue processing other rules even if one fails
      }
    }
    
  } catch (error) {
    console.error('Error in processAutomationEvent:', error)
  }
}

// Process individual automation rule
async function processAutomationRule(rule: AutomationRule, event: AutomationEvent) {
  console.log(`Processing rule: ${rule.name}`)
  
  // Check conditions
  if (rule.conditions && rule.conditions.length > 0) {
    const conditionsMet = await evaluateConditions(rule.conditions, event)
    if (!conditionsMet) {
      console.log(`Conditions not met for rule: ${rule.name}`)
      return
    }
  }
  
  // Execute actions
  for (const action of rule.actions) {
    try {
      await executeAutomationAction(action, event, rule)
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error)
    }
  }
}

// Evaluate automation conditions
async function evaluateConditions(conditions: AutomationCondition[], event: AutomationEvent): Promise<boolean> {
  const data = { ...event.new_data, ...event.metadata }
  
  for (const condition of conditions) {
    const fieldValue = data[condition.field]
    const conditionValue = condition.value
    
    let conditionMet = false
    
    switch (condition.operator) {
      case 'equals':
        conditionMet = fieldValue === conditionValue
        break
      case 'not_equals':
        conditionMet = fieldValue !== conditionValue
        break
      case 'contains':
        conditionMet = fieldValue && fieldValue.toString().toLowerCase().includes(conditionValue?.toLowerCase() || '')
        break
      case 'not_contains':
        conditionMet = !fieldValue || !fieldValue.toString().toLowerCase().includes(conditionValue?.toLowerCase() || '')
        break
      case 'is_empty':
        conditionMet = !fieldValue || fieldValue === ''
        break
      case 'is_not_empty':
        conditionMet = fieldValue && fieldValue !== ''
        break
      default:
        console.warn(`Unknown condition operator: ${condition.operator}`)
        conditionMet = false
    }
    
    if (!conditionMet) {
      console.log(`Condition failed: ${condition.field} ${condition.operator} ${conditionValue}`)
      return false
    }
  }
  
  return true
}

// Execute automation action
async function executeAutomationAction(action: AutomationActionConfig, event: AutomationEvent, rule: AutomationRule) {
  console.log(`Executing action: ${action.type}`)
  
  // Handle delay
  if (action.config.delay_minutes && action.config.delay_minutes > 0) {
    // For now, execute immediately. In production, you'd queue this for later execution
    console.log(`Action delayed by ${action.config.delay_minutes} minutes (immediate execution for demo)`)
  }
  
  switch (action.type) {
    case 'send_email':
    case 'send_sms':
    case 'send_whatsapp':
      await executeMessagingAction(action, event)
      break
      
    case 'create_task':
      await executeCreateTaskAction(action, event)
      break
      
    case 'update_status':
      await executeUpdateStatusAction(action, event)
      break
      
    case 'add_note':
      await executeAddNoteAction(action, event)
      break
      
    default:
      console.warn(`Unknown action type: ${action.type}`)
  }
}

// Execute messaging actions (email/SMS/WhatsApp)
async function executeMessagingAction(action: AutomationActionConfig, event: AutomationEvent) {
  const { channel, template } = action.config
  
  if (!channel || !template) {
    console.error('Missing channel or template for messaging action')
    return
  }
  
  try {
    let endpoint = ''
    let payload: any = {
      leadId: event.lead_id,
      tenantId: event.tenant_id,
      type: template
    }
    
    if (channel === 'email') {
      endpoint = '/api/email/send'
    } else if (channel === 'sms' || channel === 'whatsapp') {
      endpoint = '/api/messaging/send'
      payload.channel = channel
    }
    
    // Add status change context if available
    if (event.trigger === 'status_changed' && event.old_data && event.new_data) {
      payload.oldStatus = event.old_data.status
      payload.newStatus = event.new_data.status
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log(`${channel} sent successfully:`, result.messageId)
    
  } catch (error) {
    console.error(`Error sending ${channel}:`, error)
  }
}

// Execute create task action
async function executeCreateTaskAction(action: AutomationActionConfig, event: AutomationEvent) {
  const { task_title, task_description, due_date_offset_days } = action.config
  
  // For now, just log the task creation. In a full implementation, 
  // you'd create actual tasks in a tasks table
  console.log('Creating task:', {
    title: task_title,
    description: task_description,
    leadId: event.lead_id,
    tenantId: event.tenant_id,
    dueDateOffset: due_date_offset_days
  })
}

// Execute update status action
async function executeUpdateStatusAction(action: AutomationActionConfig, event: AutomationEvent) {
  const { new_status } = action.config
  
  if (!new_status) {
    console.error('Missing new_status for update status action')
    return
  }
  
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('leads')
      .update({ status: new_status })
      .eq('id', event.lead_id)
      .eq('tenant_id', event.tenant_id)
    
    if (error) {
      throw error
    }
    
    console.log(`Status updated to: ${new_status}`)
    
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

// Execute add note action
async function executeAddNoteAction(action: AutomationActionConfig, event: AutomationEvent) {
  const { note_content } = action.config
  
  if (!note_content) {
    console.error('Missing note_content for add note action')
    return
  }
  
  try {
    const supabase = await createClient()
    
    // Add note to lead activities table
    const { error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: event.lead_id,
        tenant_id: event.tenant_id,
        type: 'note_added',
        description: note_content,
        metadata: {
          automated: true,
          trigger: event.trigger
        }
      })
    
    if (error) {
      throw error
    }
    
    console.log('Note added via automation')
    
  } catch (error) {
    console.error('Error adding note:', error)
  }
}