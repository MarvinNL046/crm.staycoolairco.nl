import { createClient } from '@/lib/supabase/server'
import WebhookSettings from '@/components/settings/WebhookSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's first tenant (for MVP)
  const { data: userTenants } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(id, name)')
    .eq('user_id', user.id)
    .single()

  if (!userTenants) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configureer je CRM instellingen en integraties
          </p>
        </div>

        <div className="space-y-8">
          <WebhookSettings 
            tenantId={userTenants.tenant_id}
            tenantName={userTenants.tenants?.name || ''}
          />
        </div>
      </div>
    </div>
  )
}