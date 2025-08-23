"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowLeft,
  Save,
  Send,
  Calendar,
  Users,
  Eye,
  Smartphone,
  Monitor,
  Mail
} from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface Campaign {
  id: string
  name: string
  subject: string
  preview_text: string
  from_name: string
  from_email: string
  reply_to_email: string
  content_html: string
  content_text: string
  segment_type: string
  status: string
  recipient_count: number
}

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    fetchCampaign()
  }, [params.id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${params.id}`)
      const data = await response.json()
      
      if (data.campaign) {
        setCampaign(data.campaign)
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!campaign) return
    setSaving(true)

    try {
      const response = await fetch(`/api/campaigns/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaign.name,
          subject: campaign.subject,
          preview_text: campaign.preview_text,
          from_name: campaign.from_name,
          from_email: campaign.from_email,
          reply_to_email: campaign.reply_to_email,
          content_html: campaign.content_html,
          content_text: campaign.content_text,
          segment_type: campaign.segment_type
        })
      })

      if (response.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (schedule?: boolean) => {
    if (!campaign) return

    // First save the campaign
    await handleSave()

    try {
      const body: any = {}
      if (schedule) {
        // For demo, schedule for tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        body.schedule_at = tomorrow.toISOString()
      }

      const response = await fetch(`/api/campaigns/${params.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        router.push('/crm/campaigns')
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
    }
  }

  const generateHTMLContent = () => {
    if (!campaign) return ''
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .content { padding: 40px 20px; background: #f8f9fa; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${campaign.name}</h1>
    </div>
    <div class="content">
      ${campaign.content_html || `
        <h2>Beste klant,</h2>
        <p>Dit is een voorbeeld email inhoud. Pas deze aan naar wens.</p>
        <p>Met vriendelijke groet,<br>${campaign.from_name}</p>
      `}
    </div>
    <div class="footer">
      <p>© 2024 StayCool Airco. Alle rechten voorbehouden.</p>
      <p><a href="#">Uitschrijven</a> | <a href="#">Voorkeuren aanpassen</a></p>
    </div>
  </div>
</body>
</html>
    `
  }

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Campaign laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/crm/campaigns')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">Concept</Badge>
              <span className="text-sm text-muted-foreground">
                Laatst bewerkt: {new Date().toLocaleDateString('nl-NL')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
          <Button variant="outline" onClick={() => handleSend(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            Plannen
          </Button>
          <Button onClick={() => handleSend(false)}>
            <Send className="mr-2 h-4 w-4" />
            Nu Verzenden
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Inhoud</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Inhoud</CardTitle>
              <CardDescription>
                Schrijf de inhoud van je email campagne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Onderwerp</Label>
                <Input
                  id="subject"
                  value={campaign.subject}
                  onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                  placeholder="bijv. 20% korting op alle airco's"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preview_text">Preview Tekst</Label>
                <Input
                  id="preview_text"
                  value={campaign.preview_text || ''}
                  onChange={(e) => setCampaign({ ...campaign, preview_text: e.target.value })}
                  placeholder="Deze tekst wordt getoond in de inbox preview..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_html">HTML Inhoud</Label>
                <Textarea
                  id="content_html"
                  value={campaign.content_html || ''}
                  onChange={(e) => setCampaign({ ...campaign, content_html: e.target.value })}
                  placeholder="<h2>Beste klant,</h2><p>Dit is de HTML versie van je email...</p>"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_text">Platte Tekst Versie</Label>
                <Textarea
                  id="content_text"
                  value={campaign.content_text || ''}
                  onChange={(e) => setCampaign({ ...campaign, content_text: e.target.value })}
                  placeholder="Beste klant, Dit is de platte tekst versie van je email..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campagne Instellingen</CardTitle>
              <CardDescription>
                Configureer de verzend instellingen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_name">Afzender Naam</Label>
                  <Input
                    id="from_name"
                    value={campaign.from_name}
                    onChange={(e) => setCampaign({ ...campaign, from_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_email">Afzender Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={campaign.from_email}
                    onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply_to_email">Reply-To Email</Label>
                <Input
                  id="reply_to_email"
                  type="email"
                  value={campaign.reply_to_email || ''}
                  onChange={(e) => setCampaign({ ...campaign, reply_to_email: e.target.value })}
                  placeholder="Optioneel: waar moeten antwoorden naartoe?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment">Ontvangers Segment</Label>
                <Select
                  value={campaign.segment_type}
                  onValueChange={(value) => setCampaign({ ...campaign, segment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle contacten</SelectItem>
                    <SelectItem value="leads">Alleen leads</SelectItem>
                    <SelectItem value="customers">Alleen klanten</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Geschatte Ontvangers</span>
                </div>
                <p className="text-2xl font-bold">{campaign.recipient_count || '0'}</p>
                <p className="text-sm text-muted-foreground">
                  Op basis van het geselecteerde segment
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>
                    Zo ziet je email eruit voor ontvangers
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 border-b">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-medium">{campaign.from_name}</div>
                    <div className="text-sm text-muted-foreground">&lt;{campaign.from_email}&gt;</div>
                  </div>
                  <div className="font-medium">{campaign.subject}</div>
                  {campaign.preview_text && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {campaign.preview_text}
                    </div>
                  )}
                </div>
                <div className={previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}>
                  <iframe
                    srcDoc={generateHTMLContent()}
                    className="w-full h-[600px] bg-white"
                    title="Email Preview"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}