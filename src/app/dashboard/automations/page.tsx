import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, Mail, MessageSquare, Smartphone, Plus, Play, Pause, Settings } from 'lucide-react'

export default async function AutomationsPage() {
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

  // Get automations for this tenant
  const { data: automations } = await supabase
    .from('automations')
    .select('*')
    .eq('tenant_id', userTenants.tenant_id)
    .order('created_at', { ascending: false })

  const triggerTypeLabels: Record<string, string> = {
    'lead_created': 'Nieuwe Lead',
    'status_change': 'Status Wijziging',
    'tag_added': 'Tag Toegevoegd',
    'schedule': 'Tijdschema'
  }

  const actionChannelIcons: Record<string, any> = {
    'email': Mail,
    'sms': MessageSquare,
    'whatsapp': Smartphone
  }

  const actionChannelLabels: Record<string, string> = {
    'email': 'E-mail',
    'sms': 'SMS',
    'whatsapp': 'WhatsApp'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Automatiseringen</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Automatiseer je marketing en verkoop processen
                </p>
              </div>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Automatisering
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Totaal Automatiseringen
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {automations?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Play className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Actief
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {automations?.filter((a: any) => a.is_active).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Pause className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Gepauzeerd
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {automations?.filter((a: any) => !a.is_active).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automations List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {automations && automations.length > 0 ? (
              <div className="space-y-4">
                {automations.map((automation: any) => {
                  const ActionIcon = actionChannelIcons[automation.action_channel] || Mail
                  return (
                    <div key={automation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">{automation.name}</h3>
                            {automation.is_active ? (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Actief
                              </span>
                            ) : (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Gepauzeerd
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="font-medium">Trigger:</span>
                            <span className="ml-2">{triggerTypeLabels[automation.trigger_type] || automation.trigger_type}</span>
                            {automation.from_status && automation.to_status && (
                              <span className="ml-2">
                                ({automation.from_status} → {automation.to_status})
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="font-medium">Actie:</span>
                            <ActionIcon className="h-4 w-4 ml-2 mr-1" />
                            <span>{actionChannelLabels[automation.action_channel] || automation.action_channel}</span>
                            {automation.delay_minutes > 0 && (
                              <span className="ml-2">(na {automation.delay_minutes} minuten)</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-500">
                            <Settings className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Geen automatiseringen</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Begin met het maken van je eerste automatisering.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nieuwe Automatisering
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}