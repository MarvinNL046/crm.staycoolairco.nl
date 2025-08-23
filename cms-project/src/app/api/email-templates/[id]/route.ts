import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth'

// GET /api/email-templates/[id] - Get specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching email template:', error)
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })

  } catch (error) {
    console.error('Error in GET /api/email-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const body = await request.json()

    // If setting as default, unset other defaults for this type
    if (body.is_default) {
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('template_type', body.template_type)
        .neq('id', id)
    }

    // Update template
    const { data: template, error } = await supabase
      .from('email_templates')
      .update({
        name: body.name,
        subject: body.subject,
        template_type: body.template_type,
        html_content: body.html_content,
        text_content: body.text_content,
        variables: body.variables,
        is_default: body.is_default,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating email template:', error)
      return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 })
    }

    return NextResponse.json({ template })

  } catch (error) {
    console.error('Error in PUT /api/email-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/email-templates/[id] - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    // Check if template exists and belongs to tenant
    const { data: template, error: fetchError } = await supabase
      .from('email_templates')
      .select('id, is_default, template_type')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
    }

    // Prevent deletion of default templates (soft delete instead)
    if (template.is_default) {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Error deactivating default email template:', error)
        return NextResponse.json({ error: 'Failed to deactivate email template' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Default template deactivated successfully' })
    }

    // Hard delete non-default templates
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting email template:', error)
      return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Email template deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/email-templates/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}