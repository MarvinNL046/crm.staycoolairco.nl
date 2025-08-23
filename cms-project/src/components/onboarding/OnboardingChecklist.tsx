'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  Users, 
  FileText, 
  Settings, 
  Mail,
  Building2,
  X
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface ChecklistItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  action: () => void
}

export function OnboardingChecklist() {
  const [visible, setVisible] = useState(true)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) return

    // Check various completion states
    const [leads, contacts, invoices, emailTemplates] = await Promise.all([
      supabase.from('leads').select('id').eq('tenant_id', profile.tenant_id).limit(1),
      supabase.from('contacts').select('id').eq('tenant_id', profile.tenant_id).limit(1),
      supabase.from('invoices').select('id').eq('tenant_id', profile.tenant_id).limit(1),
      supabase.from('email_templates').select('id').eq('tenant_id', profile.tenant_id).limit(5)
    ])

    setChecklist([
      {
        id: 'add-lead',
        title: 'Voeg uw eerste lead toe',
        description: 'Begin met het toevoegen van potentiële klanten',
        icon: <Users className="w-5 h-5" />,
        completed: (leads.data?.length || 0) > 0,
        action: () => window.location.href = '/dashboard/leads'
      },
      {
        id: 'add-contact',
        title: 'Maak een contact aan',
        description: 'Voeg contactpersonen toe aan uw CRM',
        icon: <Building2 className="w-5 h-5" />,
        completed: (contacts.data?.length || 0) > 0,
        action: () => window.location.href = '/dashboard/contacts'
      },
      {
        id: 'create-invoice',
        title: 'Maak uw eerste factuur',
        description: 'Test het facturatie systeem',
        icon: <FileText className="w-5 h-5" />,
        completed: (invoices.data?.length || 0) > 0,
        action: () => window.location.href = '/invoicing/new'
      },
      {
        id: 'setup-email',
        title: 'Configureer email templates',
        description: 'Personaliseer uw email communicatie',
        icon: <Mail className="w-5 h-5" />,
        completed: (emailTemplates.data?.length || 0) > 4,
        action: () => window.location.href = '/dashboard/settings'
      },
      {
        id: 'company-settings',
        title: 'Vul bedrijfsgegevens in',
        description: 'Complete uw bedrijfsprofiel',
        icon: <Settings className="w-5 h-5" />,
        completed: false, // TODO: Check company settings
        action: () => window.location.href = '/dashboard/settings'
      }
    ])
  }

  const completedCount = checklist.filter(item => item.completed).length
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0

  if (!visible) return null

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Welkom bij StayCool CRM! 🎉</h3>
          <p className="text-sm text-gray-600 mt-1">
            Voltooi deze stappen om het meeste uit uw CRM te halen
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{completedCount} van {checklist.length} voltooid</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              item.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:border-blue-300'
            } transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {item.completed ? <Check className="w-5 h-5" /> : item.icon}
              </div>
              <div>
                <h4 className={`font-medium ${item.completed ? 'text-gray-600 line-through' : ''}`}>
                  {item.title}
                </h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
            {!item.completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={item.action}
                className="ml-4"
              >
                Start
              </Button>
            )}
          </div>
        ))}
      </div>

      {completedCount === checklist.length && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg text-center">
          <p className="text-green-800 font-medium">
            🎊 Gefeliciteerd! U heeft alle onboarding stappen voltooid!
          </p>
        </div>
      )}
    </Card>
  )
}