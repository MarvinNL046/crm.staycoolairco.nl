import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveTenantId } from '@/lib/supabase/impersonation'

export interface AuthenticatedApiContext {
  user: any
  tenantId: string
  supabase: any
}

export async function authenticateApiRequest(request: NextRequest): Promise<AuthenticatedApiContext | { error: string; status: number }> {
  // Check if we're on localhost
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  // Skip authentication on localhost and return mock data
  if (isLocalhost) {
    console.log('Localhost detected in API auth, skipping authentication')
    return {
      user: { id: 'localhost-user', email: 'test@localhost' },
      tenantId: 'localhost-tenant',
      supabase: await createClient() // This will return the mock client
    }
  }

  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Unauthorized - No valid session', status: 401 }
    }
    
    // Check if user has valid profile (prevent OAuth bypass)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return { error: 'Unauthorized - Invalid user profile', status: 401 }
    }
    
    // Get effective tenant ID (handles impersonation)
    const tenantId = await getEffectiveTenantId()
    
    if (!tenantId) {
      return { error: 'Forbidden - No tenant access', status: 403 }
    }
    
    return {
      user,
      tenantId,
      supabase
    }
  } catch (error) {
    console.error('API authentication error:', error)
    return { error: 'Internal server error', status: 500 }
  }
}

export function createUnauthorizedResponse(error: string, status: number) {
  return Response.json({ error }, { status })
}