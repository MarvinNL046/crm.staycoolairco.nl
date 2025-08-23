"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  UserPlus,
  TrendingUp,
  Calendar,
  Star,
  ShoppingCart,
  MessageSquare,
  FileText,
  Zap
} from 'lucide-react'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: any
  nodes: any[]
  edges: any[]
  isPremium?: boolean
}

const templates: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Welkom nieuwe lead',
    description: 'Stuur automatisch een welkomst email en maak een follow-up taak',
    category: 'lead',
    icon: UserPlus,
    nodes: [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { label: 'Lead Aangemaakt', type: 'trigger', trigger: 'lead_created' }
      },
      {
        id: 'email',
        type: 'action',
        position: { x: 100, y: 200 },
        data: { 
          label: 'Stuur Welkomst Email', 
          type: 'action',
          action: 'send_email',
          config: {
            subject: 'Welkom bij StayCool!',
            body: 'Beste {{lead.name}},\n\nBedankt voor uw interesse in StayCool airconditioning...'
          }
        }
      },
      {
        id: 'wait',
        type: 'action',
        position: { x: 100, y: 300 },
        data: { 
          label: 'Wacht 1 dag', 
          type: 'action',
          action: 'wait',
          config: { duration: 1, unit: 'days' }
        }
      },
      {
        id: 'task',
        type: 'action',
        position: { x: 100, y: 400 },
        data: { 
          label: 'Maak Follow-up Taak', 
          type: 'action',
          action: 'create_task',
          config: { title: 'Bel nieuwe lead {{lead.name}}' }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'email', animated: true },
      { id: 'e2', source: 'email', target: 'wait', animated: true },
      { id: 'e3', source: 'wait', target: 'task', animated: true }
    ]
  },
  {
    id: '2',
    name: 'Lead nurturing flow',
    description: 'Automatische email serie voor lead nurturing met condities',
    category: 'lead',
    icon: TrendingUp,
    nodes: [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { label: 'Lead Status = Qualified', type: 'trigger', trigger: 'lead_status_changed' }
      },
      {
        id: 'email1',
        type: 'action',
        position: { x: 300, y: 200 },
        data: { label: 'Stuur Info Email', type: 'action', action: 'send_email' }
      },
      {
        id: 'wait1',
        type: 'action',
        position: { x: 500, y: 200 },
        data: { label: 'Wacht 3 dagen', type: 'action', action: 'wait', config: { duration: 3, unit: 'days' } }
      },
      {
        id: 'condition',
        type: 'condition',
        position: { x: 700, y: 200 },
        data: { label: 'Email geopend?', type: 'condition', action: 'condition' }
      },
      {
        id: 'email2',
        type: 'action',
        position: { x: 900, y: 100 },
        data: { label: 'Stuur Follow-up', type: 'action', action: 'send_email' }
      },
      {
        id: 'task',
        type: 'action',
        position: { x: 900, y: 300 },
        data: { label: 'Bel Lead', type: 'action', action: 'create_task' }
      }
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'email1', animated: true },
      { id: 'e2', source: 'email1', target: 'wait1', animated: true },
      { id: 'e3', source: 'wait1', target: 'condition', animated: true },
      { id: 'e4', source: 'condition', target: 'email2', sourceHandle: 'yes', label: 'Ja', animated: true },
      { id: 'e5', source: 'condition', target: 'task', sourceHandle: 'no', label: 'Nee', animated: true }
    ]
  },
  {
    id: '3',
    name: 'Afspraak herinnering',
    description: 'Stuur automatische herinneringen voor afspraken',
    category: 'appointment',
    icon: Calendar,
    nodes: [
      {
        id: 'trigger',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: { label: 'Afspraak Gepland', type: 'trigger', trigger: 'appointment_scheduled' }
      },
      {
        id: 'wait',
        type: 'action',
        position: { x: 100, y: 200 },
        data: { label: 'Wacht tot 1 dag voor afspraak', type: 'action', action: 'wait' }
      },
      {
        id: 'sms',
        type: 'action',
        position: { x: 100, y: 300 },
        data: { 
          label: 'Stuur SMS Herinnering', 
          type: 'action',
          action: 'send_sms',
          config: { message: 'Herinnering: U heeft morgen een afspraak bij StayCool.' }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'wait', animated: true },
      { id: 'e2', source: 'wait', target: 'sms', animated: true }
    ]
  },
  {
    id: '4',
    name: 'Win-back campagne',
    description: 'Heractiveer inactieve klanten met speciale aanbiedingen',
    category: 'customer',
    icon: ShoppingCart,
    isPremium: true,
    nodes: [],
    edges: []
  },
  {
    id: '5',
    name: 'Review verzoek',
    description: 'Vraag om reviews na succesvolle service',
    category: 'customer',
    icon: Star,
    isPremium: true,
    nodes: [],
    edges: []
  }
]

interface WorkflowTemplateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (template: WorkflowTemplate) => void
}

export function WorkflowTemplateModal({ open, onClose, onSelect }: WorkflowTemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow Templates</DialogTitle>
          <DialogDescription>
            Kies een template om mee te beginnen of start met een lege workflow
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Alle
          </Button>
          <Button
            variant={selectedCategory === 'lead' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('lead')}
          >
            Leads
          </Button>
          <Button
            variant={selectedCategory === 'appointment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('appointment')}
          >
            Afspraken
          </Button>
          <Button
            variant={selectedCategory === 'customer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('customer')}
          >
            Klanten
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = template.icon
            
            return (
              <Card 
                key={template.id}
                className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ${
                  template.isPremium ? 'opacity-75' : ''
                }`}
                onClick={() => !template.isPremium && onSelect(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    {template.isPremium && (
                      <Badge variant="secondary">Premium</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>{template.nodes.length || '5+'} stappen</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={() => onSelect({ 
            id: 'blank',
            name: 'Lege Workflow',
            description: '',
            category: 'custom',
            icon: Zap,
            nodes: [],
            edges: []
          })}>
            Start Blanco
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}