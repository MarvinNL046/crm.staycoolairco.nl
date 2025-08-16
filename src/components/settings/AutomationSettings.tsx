'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/ToastProvider'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger_type: string
  conditions: any[]
  actions: any[]
  enabled: boolean
}

export default function AutomationSettings() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadAutomationRules()
  }, [])

  const loadAutomationRules = async () => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's tenant
      const { data: userTenants } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      if (!userTenants) return

      // Load automation rules
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('tenant_id', userTenants.tenant_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading automation rules:', error)
        showToast('error', 'Fout bij laden', 'Kon automation regels niet laden')
        return
      }

      setRules(data || [])
    } catch (error) {
      console.error('Error in loadAutomationRules:', error)
      showToast('error', 'Fout', 'Onverwachte fout bij laden van automation regels')
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    setUpdating(ruleId)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('automation_rules')
        .update({ enabled })
        .eq('id', ruleId)

      if (error) {
        console.error('Error updating automation rule:', error)
        showToast('error', 'Fout bij bijwerken', error.message)
        return
      }

      setRules(rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      ))

      showToast('success', 'Bijgewerkt', `Automation regel ${enabled ? 'ingeschakeld' : 'uitgeschakeld'}`)
    } catch (error) {
      console.error('Error in toggleRule:', error)
      showToast('error', 'Fout', 'Onverwachte fout bij bijwerken van regel')
    } finally {
      setUpdating(null)
    }
  }

  const createDefaultRules = async () => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's tenant
      const { data: userTenants } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      if (!userTenants) return

      // Call the database function to create default rules
      const { error } = await supabase.rpc('create_default_automation_rules', {
        tenant_uuid: userTenants.tenant_id
      })

      if (error) {
        console.error('Error creating default rules:', error)
        showToast('error', 'Fout bij aanmaken', error.message)
        return
      }

      showToast('success', 'Standaard regels aangemaakt', 'Default automation regels zijn toegevoegd')
      loadAutomationRules()
    } catch (error) {
      console.error('Error in createDefaultRules:', error)
      showToast('error', 'Fout', 'Onverwachte fout bij aanmaken van standaard regels')
    }
  }

  const getTriggerBadgeColor = (trigger: string) => {
    switch (trigger) {
      case 'lead_created': return 'bg-green-100 text-green-800'
      case 'status_changed': return 'bg-blue-100 text-blue-800'
      case 'lead_assigned': return 'bg-purple-100 text-purple-800'
      case 'follow_up_due': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'lead_created': return 'Nieuwe Lead'
      case 'status_changed': return 'Status Wijziging'
      case 'lead_assigned': return 'Lead Toegewezen'
      case 'follow_up_due': return 'Follow-up Vervaldatum'
      default: return trigger
    }
  }

  const getActionLabels = (actions: any[]) => {
    return actions.map(action => {
      switch (action.type) {
        case 'send_email': return '📧 Email'
        case 'send_sms': return '💬 SMS'
        case 'send_whatsapp': return '📱 WhatsApp'
        case 'create_task': return '📋 Taak Aanmaken'
        case 'update_status': return '🔄 Status Bijwerken'
        case 'add_note': return '📝 Notitie Toevoegen'
        default: return action.type
      }
    }).join(', ')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automation Regels</CardTitle>
          <CardDescription>
            Automatische acties voor leads en pipeline wijzigingen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Laden...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Regels</CardTitle>
        <CardDescription>
          Automatische acties voor leads en pipeline wijzigingen
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-gray-500 mb-4">
              Geen automation regels gevonden
            </div>
            <Button onClick={createDefaultRules}>
              Standaard Regels Aanmaken
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {rules.length} regel(s) gevonden
              </div>
              <Button variant="outline" onClick={createDefaultRules}>
                + Standaard Regels Toevoegen
              </Button>
            </div>

            {rules.map((rule) => (
              <div
                key={rule.id}
                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className={getTriggerBadgeColor(rule.trigger_type)}
                      >
                        {getTriggerLabel(rule.trigger_type)}
                      </Badge>
                      {rule.enabled ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Actief
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                          Inactief
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <strong>Acties:</strong> {getActionLabels(rule.actions)}
                      </span>
                      {rule.conditions && rule.conditions.length > 0 && (
                        <span>
                          <strong>Voorwaarden:</strong> {rule.conditions.length}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center ml-4">
                    <Switch
                      checked={rule.enabled}
                      disabled={updating === rule.id}
                      onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}