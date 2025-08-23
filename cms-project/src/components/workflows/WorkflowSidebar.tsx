"use client"

import { useState } from 'react'
import { Node } from 'reactflow'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkflowSidebarProps {
  node: Node
  onClose: () => void
  onUpdate: (node: Node) => void
}

export function WorkflowSidebar({ node, onClose, onUpdate }: WorkflowSidebarProps) {
  const [label, setLabel] = useState(node.data.label || '')
  const [config, setConfig] = useState(node.data.config || {})

  const handleSave = () => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        label,
        config
      }
    })
    onClose()
  }

  const renderConfig = () => {
    const action = node.data.action || node.data.trigger

    switch (action) {
      case 'send_email':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="to">Aan (Email)</Label>
              <Input
                id="to"
                placeholder="{{lead.email}}"
                value={config.to || ''}
                onChange={(e) => setConfig({ ...config, to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Onderwerp</Label>
              <Input
                id="subject"
                placeholder="Welkom bij StayCool!"
                value={config.subject || ''}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Inhoud</Label>
              <Textarea
                id="body"
                placeholder="Beste {{lead.name}},\n\nBedankt voor uw interesse..."
                rows={6}
                value={config.body || ''}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
              />
            </div>
          </>
        )

      case 'wait':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="duration">Duur</Label>
              <Input
                id="duration"
                type="number"
                placeholder="1"
                value={config.duration || ''}
                onChange={(e) => setConfig({ ...config, duration: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Eenheid</Label>
              <Select
                value={config.unit || 'hours'}
                onValueChange={(value) => setConfig({ ...config, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minuten</SelectItem>
                  <SelectItem value="hours">Uren</SelectItem>
                  <SelectItem value="days">Dagen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      case 'create_task':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Taak Titel</Label>
              <Input
                id="title"
                placeholder="Follow-up met {{lead.name}}"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                placeholder="Neem contact op met de lead..."
                rows={4}
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Deadline</Label>
              <Select
                value={config.due || '1_day'}
                onValueChange={(value) => setConfig({ ...config, due: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately">Direct</SelectItem>
                  <SelectItem value="1_day">Over 1 dag</SelectItem>
                  <SelectItem value="3_days">Over 3 dagen</SelectItem>
                  <SelectItem value="1_week">Over 1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      case 'update_lead_status':
        return (
          <div className="space-y-2">
            <Label htmlFor="status">Nieuwe Status</Label>
            <Select
              value={config.status || 'contacted'}
              onValueChange={(value) => setConfig({ ...config, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Nieuw</SelectItem>
                <SelectItem value="contacted">Gecontacteerd</SelectItem>
                <SelectItem value="qualified">Gekwalificeerd</SelectItem>
                <SelectItem value="proposal">Offerte</SelectItem>
                <SelectItem value="won">Gewonnen</SelectItem>
                <SelectItem value="lost">Verloren</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'condition':
        return (
          <div className="space-y-2">
            <Label>Conditie Type</Label>
            <Select
              value={config.type || 'email_opened'}
              onValueChange={(value) => setConfig({ ...config, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email_opened">Email Geopend</SelectItem>
                <SelectItem value="link_clicked">Link Geklikt</SelectItem>
                <SelectItem value="lead_status">Lead Status</SelectItem>
                <SelectItem value="tag_exists">Tag Aanwezig</SelectItem>
                <SelectItem value="custom">Aangepast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'lead_created':
      case 'form_submitted':
        return (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Deze trigger start automatisch wanneer {action === 'lead_created' ? 'een nieuwe lead wordt aangemaakt' : 'een formulier wordt ingediend'}.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-80 border-l bg-background p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Eigenschappen</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{node.data.label}</CardTitle>
          <CardDescription>
            {node.data.type === 'trigger' ? 'Trigger' : 'Actie'} configuratie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Naam</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Geef deze stap een naam"
            />
          </div>

          {renderConfig()}

          <div className="pt-4">
            <Button onClick={handleSave} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Opslaan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variabelen helper */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Beschikbare Variabelen</CardTitle>
          <CardDescription>Gebruik deze in je teksten</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="font-mono bg-muted p-2 rounded">{'{{lead.name}}'}</div>
            <div className="font-mono bg-muted p-2 rounded">{'{{lead.email}}'}</div>
            <div className="font-mono bg-muted p-2 rounded">{'{{lead.phone}}'}</div>
            <div className="font-mono bg-muted p-2 rounded">{'{{lead.company}}'}</div>
            <div className="font-mono bg-muted p-2 rounded">{'{{current_date}}'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}