import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest, createUnauthorizedResponse } from '@/lib/auth/api-auth';

// PATCH /api/leads/[id]/status - Update lead status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Authenticate user and get tenant
  const authResult = await authenticateApiRequest(request);
  if ('error' in authResult) {
    return createUnauthorizedResponse(authResult.error, authResult.status);
  }

  const { supabase, tenantId } = authResult;

  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // SECURITY: Update lead status only for user's tenant
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .eq('tenant_id', tenantId) // SECURITY: Only user's tenant
      .select()
      .single();

    if (error) {
      console.error('Error updating lead status:', error);
      console.error('Lead ID:', resolvedParams.id);
      console.error('Status:', status);
      return NextResponse.json({ 
        error: 'Failed to update lead status',
        details: error.message,
        leadId: resolvedParams.id,
        requestedStatus: status
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      lead: data,
      message: `Lead status updated to ${status}` 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}