import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'

export interface ImpersonationContext {
  isImpersonating: boolean
  tenantId: string | null
  originalSuperAdminId: string | null
  actualUser: any
}

export async function getImpersonationContext(): Promise<ImpersonationContext> {
  // Check if we're on localhost
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  // Skip authentication on localhost
  if (isLocalhost) {
    return {
      isImpersonating: false,
      tenantId: null,
      originalSuperAdminId: null,
      actualUser: null
    }
  }

  const cookieStore = await cookies()
  
  const impersonatingTenantId = cookieStore.get('impersonating_tenant_id')?.value || 
                                headersList.get('x-impersonating-tenant-id')
  const originalSuperAdminId = cookieStore.get('original_super_admin_id')?.value ||
                               headersList.get('x-original-super-admin-id')
  
  const supabase = await createClient()
  const { data: { user: actualUser } } = await supabase.auth.getUser()

  return {
    isImpersonating: !!(impersonatingTenantId && originalSuperAdminId),
    tenantId: impersonatingTenantId || null,
    originalSuperAdminId: originalSuperAdminId || null,
    actualUser
  }
}

export async function getEffectiveTenantId(): Promise<string | null> {
  // Check if we're on localhost
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  
  // Return a default tenant ID for localhost
  if (isLocalhost) {
    return 'localhost-tenant'
  }

  const { isImpersonating, tenantId } = await getImpersonationContext()
  
  if (isImpersonating && tenantId) {
    return tenantId
  }

  // Get tenant from user profile as normal
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  return profile?.tenant_id || null
}