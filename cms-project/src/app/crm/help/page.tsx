"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Zap,
  Bug,
  FileQuestion,
  Lightbulb,
  ExternalLink,
  ArrowRight
} from "lucide-react"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [supportEmail, setSupportEmail] = useState("")

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Show success message
    toast.success("Support verzoek verstuurd", {
      description: "We nemen binnen 24 uur contact met je op."
    })
    
    // Reset form
    setSupportMessage("")
    setSupportEmail("")
  }

  const quickLinks = [
    {
      title: "Documentatie",
      description: "Uitgebreide handleidingen",
      icon: BookOpen,
      href: "/crm/docs",
      color: "text-blue-600"
    },
    {
      title: "Workflow Automation",
      description: "Automation instellen",
      icon: Zap,
      href: "/crm/docs?section=automation",
      color: "text-purple-600"
    },
    {
      title: "Problemen oplossen",
      description: "Veelvoorkomende issues",
      icon: Bug,
      href: "#troubleshooting",
      color: "text-red-600"
    },
    {
      title: "Feature verzoeken",
      description: "Nieuwe functionaliteit",
      icon: Lightbulb,
      href: "#feature-request",
      color: "text-yellow-600"
    }
  ]

  const commonIssues = [
    {
      question: "Ik kan geen emails versturen",
      answer: "Check of je SMTP instellingen correct zijn geconfigureerd onder Instellingen → Email. Zorg dat poort 587 open staat.",
      category: "email"
    },
    {
      question: "Workflow wordt niet getriggerd",
      answer: "Controleer of de workflow actief staat en of de trigger condities kloppen. Check ook de workflow execution logs.",
      category: "automation"
    },
    {
      question: "Import mislukt met foutmelding",
      answer: "Zorg dat je CSV UTF-8 encoded is en de juiste kolommen bevat (naam, email, telefoon). Verwijder speciale karakters.",
      category: "import"
    },
    {
      question: "Dashboard laadt langzaam",
      answer: "Clear je browser cache. Als het probleem aanhoudt, probeer een andere browser of incognito modus.",
      category: "performance"
    }
  ]

  const filteredIssues = commonIssues.filter(issue =>
    issue.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground mt-2">
          Vind antwoorden op je vragen of neem contact op met support
        </p>
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Zoek in help artikelen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {quickLinks.map((link) => (
          <Card key={link.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <a href={link.href}>
              <CardHeader>
                <link.icon className={`h-8 w-8 ${link.color} mb-2`} />
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </a>
          </Card>
        ))}
      </div>

      {/* Common Issues */}
      <Card className="mb-8" id="troubleshooting">
        <CardHeader>
          <CardTitle>Veelvoorkomende problemen</CardTitle>
          <CardDescription>Snelle oplossingen voor bekende issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredIssues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Geen resultaten gevonden voor "{searchQuery}"
            </p>
          ) : (
            filteredIssues.map((issue, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{issue.question}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{issue.answer}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Direct contact</CardTitle>
            <CardDescription>Bereik ons support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Telefoon</p>
                  <p className="text-sm text-muted-foreground">+31 (0)20 123 4567</p>
                  <p className="text-xs text-muted-foreground">Ma-Vr 9:00 - 17:00</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@staycoolairco.nl</p>
                  <p className="text-xs text-muted-foreground">Reactie binnen 24 uur</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Live chat</p>
                  <p className="text-sm text-muted-foreground">Via het chat widget rechtsonder</p>
                  <p className="text-xs text-muted-foreground">Ma-Vr 9:00 - 17:00</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 mt-4">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-900">Systeem status</p>
                  <p className="text-green-700">Alle systemen operationeel</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="feature-request">
          <CardHeader>
            <CardTitle>Support ticket</CardTitle>
            <CardDescription>Stuur ons een bericht</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email" 
                  placeholder="jouw@email.nl"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  required 
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Bericht</label>
                <Textarea 
                  placeholder="Beschrijf je vraag of probleem..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  required
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Voeg indien mogelijk screenshots of error messages toe</span>
              </div>
              
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Verstuur bericht
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Handige resources</CardTitle>
          <CardDescription>Extra hulp en informatie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a href="/crm/docs" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Gebruikershandleiding</p>
                <p className="text-xs text-muted-foreground">Complete documentatie</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </a>
            
            <a href="#" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <FileQuestion className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Video tutorials</p>
                <p className="text-xs text-muted-foreground">Stap voor stap uitleg</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>
            
            <a href="#" className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
              <Lightbulb className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Best practices</p>
                <p className="text-xs text-muted-foreground">Tips van experts</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}