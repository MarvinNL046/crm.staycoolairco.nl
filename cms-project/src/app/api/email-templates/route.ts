import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'

// GET /api/email-templates - Get all email templates for tenant
export async function GET(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('template_type', { ascending: true })

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })

  } catch (error) {
    console.error('Error in GET /api/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/email-templates - Create new email template
export async function POST(request: NextRequest) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId, user } = authResult;

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.subject || !body.template_type || !body.html_content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject, template_type, html_content' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this type
    if (body.is_default) {
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('template_type', body.template_type)
    }

    // Create template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        tenant_id: tenantId,
        name: body.name,
        subject: body.subject,
        template_type: body.template_type,
        html_content: body.html_content,
        text_content: body.text_content || '',
        variables: body.variables || {},
        is_default: body.is_default || false,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email template:', error)
      return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/email-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}