"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Copy,
  Eye,
  EyeOff,
  Webhook,
  Settings,
  Code,
  TestTube,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react"

export default function SettingsPage() {
  const [webhookSecret, setWebhookSecret] = useState('wh_secret_abc123xyz789')
  const [showSecret, setShowSecret] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm.staycoolairco.nl'}/api/webhook/leads`

  const generateNewSecret = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const newSecret = 'wh_secret_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      setWebhookSecret(newSecret)
      setIsGenerating(false)
    }, 1000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const testWebhook = async () => {
    try {
      const response = await fetch('/api/webhook/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Contact',
          email: 'test@example.com',
          phone: '+31 6 1234 5678',
          company: 'Test Company',
          message: 'This is a test webhook submission',
          source: 'webhook_test'
        })
      })

      if (response.ok) {
        setTestResult('success')
      } else {
        setTestResult('error')
      }
    } catch (error) {
      setTestResult('error')
    }

    setTimeout(() => setTestResult(null), 3000)
  }

  const htmlFormExample = `<!-- Contact Form Example for StayCool Air Conditioning -->
<form action="${webhookUrl}" method="POST">
  <input type="text" name="name" placeholder="Your Name" required>
  <input type="email" name="email" placeholder="Your Email" required>
  <input type="tel" name="phone" placeholder="Your Phone">
  <input type="text" name="company" placeholder="Company Name">
  <textarea name="message" placeholder="Tell us about your air conditioning needs"></textarea>
  <input type="hidden" name="source" value="staycool_website">
  <button type="submit">Request Quote</button>
</form>`

  const jsExample = `// JavaScript Fetch Example for StayCool
const formData = {
  name: 'Jan Janssen',
  email: 'jan@bakkerijjanssen.nl',
  phone: '+31 6 1234 5678',
  company: 'Bakkerij Janssen',
  message: 'We need air conditioning for our bakery, can you provide a quote?',
  source: 'staycool_website'
};

fetch('${webhookUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': 'your_signature_here'
  },
  body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => console.log('Lead created:', data));`

  const curlExample = `# cURL Example for StayCool webhook
curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: your_signature_here" \\
  -d '{
    "name": "Jan Janssen",
    "email": "jan@bakkerijjanssen.nl",
    "phone": "+31 6 1234 5678",
    "company": "Bakkerij Janssen",
    "message": "We need air conditioning for our bakery, can you provide a quote?",
    "source": "staycool_website"
  }'`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>
          <p className="text-muted-foreground">
            Configureer je CRM integraties en webhooks
          </p>
        </div>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Algemeen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Lead Ontvangst Webhook
              </CardTitle>
              <CardDescription>
                Importeer automatisch leads vanaf je website contactformulieren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stuur POST verzoeken naar deze URL om nieuwe leads aan te maken
                </p>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="webhook-secret"
                      type={showSecret ? "text" : "password"}
                      value={webhookSecret}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(webhookSecret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateNewSecret}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gebruik dit geheim om je webhook verzoeken te ondertekenen voor beveiliging
                </p>
              </div>

              {/* Test Webhook */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">Test Webhook</h4>
                  <p className="text-sm text-muted-foreground">
                    Stuur een test verzoek om te controleren of je webhook werkt
                  </p>
                </div>
                <Button onClick={testWebhook} className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Nu
                </Button>
                {testResult === 'success' && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Gelukt
                  </Badge>
                )}
                {testResult === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Fout
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Required Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Verplichte Velden</CardTitle>
              <CardDescription>
                Velden die moeten worden opgenomen in webhook verzoeken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700">Verplicht</h4>
                  <div className="space-y-1">
                    <Badge variant="outline">name</Badge>
                    <Badge variant="outline">email</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-700">Optioneel</h4>
                  <div className="space-y-1 flex flex-wrap gap-1">
                    <Badge variant="secondary">phone</Badge>
                    <Badge variant="secondary">company</Badge>
                    <Badge variant="secondary">message</Badge>
                    <Badge variant="secondary">source</Badge>
                    <Badge variant="secondary">website</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Integratie Voorbeelden
              </CardTitle>
              <CardDescription>
                Kopieer en plak deze voorbeelden om te integreren met je website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML Formulier</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>HTML Contactformulier</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(htmlFormExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiëren
                    </Button>
                  </div>
                  <Textarea
                    value={htmlFormExample}
                    readOnly
                    className="font-mono text-sm h-48"
                  />
                </TabsContent>

                <TabsContent value="javascript" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>JavaScript Fetch</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(jsExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiëren
                    </Button>
                  </div>
                  <Textarea
                    value={jsExample}
                    readOnly
                    className="font-mono text-sm h-48"
                  />
                </TabsContent>

                <TabsContent value="curl" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>cURL Commando</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(curlExample)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopiëren
                    </Button>
                  </div>
                  <Textarea
                    value={curlExample}
                    readOnly
                    className="font-mono text-sm h-48"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Documentation Link */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Hulp Nodig?</h4>
                  <p className="text-sm text-muted-foreground">
                    Bekijk onze webhook documentatie voor meer voorbeelden en probleemoplossing
                  </p>
                </div>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Bekijk Documentatie
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bedrijfsinformatie</CardTitle>
              <CardDescription>
                Basisinformatie over je bedrijf
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Bedrijfsnaam</Label>
                  <Input id="company-name" defaultValue="StayCool Air Conditioning" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat-number">BTW Nummer</Label>
                  <Input id="vat-number" defaultValue="NL123456789B01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input id="phone" defaultValue="+31 20 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="info@staycoolairco.nl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" defaultValue="Keizersgracht 123
1016 EA Amsterdam
Netherlands" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regionale Instellingen</CardTitle>
              <CardDescription>
                Configureer je regionale voorkeuren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Valuta</Label>
                  <Select defaultValue="eur">
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="europe/amsterdam">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe/amsterdam">Europe/Amsterdam</SelectItem>
                      <SelectItem value="europe/london">Europe/London</SelectItem>
                      <SelectItem value="europe/paris">Europe/Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Datumnotatie</Label>
                  <Select defaultValue="dd-mm-yyyy">
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Taal</Label>
                  <Select defaultValue="nl">
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zakelijke Instellingen</CardTitle>
              <CardDescription>
                Configureer zakelijke specifieke instellingen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Factuur Voorvoegsel</Label>
                  <Input id="invoice-prefix" defaultValue="INV" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-prefix">Offerte Voorvoegsel</Label>
                  <Input id="quote-prefix" defaultValue="QTE" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat-rate">Standaard BTW Tarief (%)</Label>
                  <Input id="vat-rate" type="number" defaultValue="21" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Betalingstermijn (dagen)</Label>
                  <Input id="payment-terms" type="number" defaultValue="30" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-footer">Factuur Voettekst</Label>
                <Textarea 
                  id="invoice-footer" 
                  defaultValue="Bedankt voor uw vertrouwen! Voor vragen over deze factuur kunt u contact opnemen met onze administratie."
                  className="h-20"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Wijzigingen Opslaan</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}