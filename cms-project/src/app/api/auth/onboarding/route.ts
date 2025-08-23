import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// SaaS Onboarding API - Maakt nieuwe tenant aan met alle benodigde data
export async function POST(request: Request) {
  try {
    const { 
      companyName, 
      subdomain, 
      plan = 'trial',
      industry = 'general'
    } = await request.json()

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if subdomain is available
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (existingTenant) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 400 })
    }

    // Start transaction-like behavior
    // 1. Create tenant
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14 dagen trial

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: companyName,
        subdomain: subdomain,
        plan: plan,
        status: 'active',
        timezone: 'Europe/Amsterdam',
        trial_ends_at: plan === 'trial' ? trialEndsAt.toISOString() : null,
        max_users: plan === 'trial' ? 2 : plan === 'starter' ? 5 : 999,
        max_leads: plan === 'trial' ? 100 : plan === 'starter' ? 1000 : 999999
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // 2. Update user profile with tenant_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        tenant_id: tenant.id,
        role: 'owner' // First user is owner
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 3. Create default BTW percentages
    const { error: btwError } = await supabase
      .from('btw_percentages')
      .insert([
        { tenant_id: tenant.id, percentage: 0, description: 'Vrijgesteld van BTW', is_default: false },
        { tenant_id: tenant.id, percentage: 9, description: 'Verlaagd tarief', is_default: false },
        { tenant_id: tenant.id, percentage: 21, description: 'Standaard tarief', is_default: true }
      ])

    if (btwError) throw btwError

    // 4. Create default tags based on industry
    const defaultTags = industry === 'hvac' ? [
      { tenant_id: tenant.id, name: 'Airco Installatie', color: '#3B82F6' },
      { tenant_id: tenant.id, name: 'Onderhoud', color: '#10B981' },
      { tenant_id: tenant.id, name: 'Storing', color: '#EF4444' },
      { tenant_id: tenant.id, name: 'Offerte', color: '#F59E0B' },
      { tenant_id: tenant.id, name: 'Contract', color: '#8B5CF6' },
      { tenant_id: tenant.id, name: 'Particulier', color: '#6366F1' },
      { tenant_id: tenant.id, name: 'Zakelijk', color: '#14B8A6' },
      { tenant_id: tenant.id, name: 'VIP', color: '#F97316' }
    ] : [
      { tenant_id: tenant.id, name: 'Nieuw', color: '#3B82F6' },
      { tenant_id: tenant.id, name: 'Belangrijk', color: '#EF4444' },
      { tenant_id: tenant.id, name: 'Follow-up', color: '#F59E0B' },
      { tenant_id: tenant.id, name: 'Contract', color: '#10B981' },
      { tenant_id: tenant.id, name: 'Service', color: '#8B5CF6' },
      { tenant_id: tenant.id, name: 'Offerte', color: '#6366F1' },
      { tenant_id: tenant.id, name: 'Onderhoud', color: '#14B8A6' },
      { tenant_id: tenant.id, name: 'Urgent', color: '#F97316' }
    ]

    const { error: tagsError } = await supabase
      .from('tags')
      .insert(defaultTags)

    if (tagsError) throw tagsError

    // 5. Create pipeline stages
    const { error: pipelineError } = await supabase
      .from('pipeline_stages')
      .insert([
        { tenant_id: tenant.id, name: 'Nieuw', color: '#3B82F6', order_position: 1 },
        { tenant_id: tenant.id, name: 'Gekwalificeerd', color: '#10B981', order_position: 2 },
        { tenant_id: tenant.id, name: 'Offerte', color: '#F59E0B', order_position: 3 },
        { tenant_id: tenant.id, name: 'Onderhandeling', color: '#8B5CF6', order_position: 4 },
        { tenant_id: tenant.id, name: 'Gewonnen', color: '#059669', order_position: 5 },
        { tenant_id: tenant.id, name: 'Verloren', color: '#DC2626', order_position: 6 }
      ])

    if (pipelineError) throw pipelineError

    // 6. Create email templates
    const emailTemplates = [
      {
        tenant_id: tenant.id,
        name: 'Welkom - Nieuwe Lead',
        subject: `Welkom bij ${companyName}`,
        body: `Beste {{name}},\n\nBedankt voor uw interesse in ${companyName}. Wij zijn specialist in onze branche en helpen u graag met het vinden van de perfecte oplossing.\n\nEen van onze specialisten neemt binnenkort contact met u op om uw wensen te bespreken.\n\nMet vriendelijke groet,\nHet ${companyName} Team`,
        category: 'welcome',
        variables: ['name']
      },
      {
        tenant_id: tenant.id,
        name: 'Offerte Opvolging',
        subject: `Uw offerte van ${companyName}`,
        body: `Beste {{name}},\n\nOnlangs hebben wij u een offerte gestuurd voor {{company}}. Wij zijn benieuwd of u nog vragen heeft over onze offerte.\n\nMocht u aanvullende informatie wensen of een afspraak willen maken, neem dan gerust contact met ons op.\n\nMet vriendelijke groet,\n{{sales_person}}\n${companyName}`,
        category: 'sales',
        variables: ['name', 'company', 'sales_person']
      },
      {
        tenant_id: tenant.id,
        name: 'Afspraak Herinnering',
        subject: 'Herinnering: Afspraak morgen',
        body: `Beste {{name}},\n\nDit is een herinnering voor onze afspraak morgen om {{time}}.\n\nLocatie: {{location}}\n\nTot morgen!\n\nMet vriendelijke groet,\n${companyName}`,
        category: 'reminder',
        variables: ['name', 'time', 'location']
      },
      {
        tenant_id: tenant.id,
        name: 'Bedankt voor uw vertrouwen',
        subject: `Bedankt voor uw vertrouwen in ${companyName}`,
        body: `Beste {{name}},\n\nBedankt voor uw vertrouwen in ${companyName}. Wij zijn blij dat we u van dienst mogen zijn.\n\nMocht u vragen hebben of hulp nodig hebben, aarzel dan niet om contact met ons op te nemen.\n\nMet vriendelijke groet,\n${companyName}`,
        category: 'thank-you',
        variables: ['name']
      }
    ]

    const { error: emailError } = await supabase
      .from('email_templates')
      .insert(emailTemplates)

    if (emailError) throw emailError

    // 7. Create sample automation rules
    const { error: automationError } = await supabase
      .from('automation_rules')
      .insert([
        {
          tenant_id: tenant.id,
          name: 'Stuur welkom email bij nieuwe lead',
          trigger_type: 'lead_created',
          conditions: { status: ['new'] },
          actions: [{ 
            type: 'send_email', 
            template: 'welcome',
            delay_minutes: 5 
          }],
          is_active: true
        },
        {
          tenant_id: tenant.id,
          name: 'Follow-up na offerte',
          trigger_type: 'lead_status_changed',
          conditions: { new_status: 'quote_sent' },
          actions: [{ 
            type: 'create_task', 
            title: 'Follow-up offerte',
            delay_days: 3 
          }],
          is_active: true
        }
      ])

    if (automationError) throw automationError

    // 8. Create welcome notification
    const { error: notificationError } = await supabase
      .from('email_logs')
      .insert({
        tenant_id: tenant.id,
        to_email: user.email || '',
        from_email: 'noreply@staycoolcrm.nl',
        subject: `Welkom bij StayCool CRM!`,
        body: `Uw account is succesvol aangemaakt. U kunt nu inloggen op ${subdomain}.staycoolcrm.nl`,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    // Return success with tenant info
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        trial_ends_at: tenant.trial_ends_at
      },
      message: 'Onboarding completed successfully!'
    })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}