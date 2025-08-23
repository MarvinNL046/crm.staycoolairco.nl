"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Users, 
  Zap, 
  FileText, 
  Settings, 
  HelpCircle,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  BarChart3,
  Workflow,
  Receipt,
  UserCheck,
  Building2,
  TrendingUp,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Timer,
  Target,
  Sparkles,
  MessageSquare,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Key,
  RefreshCw,
  ArrowRight,
  Webhook,
  Copy,
  Code,
  Lock,
  Server,
  ExternalLink
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started")

  const sections = [
    { id: "getting-started", title: "Aan de slag", icon: BookOpen },
    { id: "leads", title: "Leads beheren", icon: UserCheck },
    { id: "contacts", title: "Contacten", icon: Users },
    { id: "invoicing", title: "Facturatie", icon: FileText },
    { id: "automation", title: "Workflow Automation", icon: Zap },
    { id: "webhooks", title: "Webhook Integratie", icon: Globe },
    { id: "analytics", title: "Analytics & Rapporten", icon: BarChart3 },
    { id: "settings", title: "Instellingen", icon: Settings },
    { id: "faq", title: "Veelgestelde vragen", icon: HelpCircle },
  ]

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r bg-background">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Documentatie</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Leer alles over StayCool CRM
          </p>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="px-3 pb-6">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="mr-2 h-4 w-4" />
                {section.title}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-full">
          <div className="container max-w-4xl py-8">
            {activeSection === "getting-started" && <GettingStartedSection setActiveSection={setActiveSection} />}
            {activeSection === "leads" && <LeadsSection />}
            {activeSection === "contacts" && <ContactsSection />}
            {activeSection === "invoicing" && <InvoicingSection />}
            {activeSection === "automation" && <AutomationSection />}
            {activeSection === "webhooks" && <WebhooksSection />}
            {activeSection === "analytics" && <AnalyticsSection />}
            {activeSection === "settings" && <SettingsSection />}
            {activeSection === "faq" && <FAQSection />}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function GettingStartedSection({ setActiveSection }: { setActiveSection: (section: string) => void }) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welkom bij StayCool CRM</h1>
        <p className="text-muted-foreground mt-2">
          Alles wat je moet weten om snel aan de slag te gaan met je CRM
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Snel starten</CardTitle>
            <CardDescription>Begin hier met de basis van StayCool CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">1. Dashboard overzicht</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Het dashboard toont je belangrijkste metrics: nieuwe leads, openstaande taken, 
                  omzet deze maand en actieve deals. Je ziet direct wat aandacht nodig heeft.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">2. Je eerste lead toevoegen</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Ga naar Leads → Nieuwe Lead. Vul minimaal naam, email en telefoon in. 
                  Het systeem begint direct met het bijhouden van alle interacties.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">3. Workflow automation instellen</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatiseer terugkerende taken zoals welkom emails, follow-ups en taak toewijzingen. 
                  Ga naar Automation → Workflow Builder om te beginnen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <UserCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Beheer potentiële klanten vanaf eerste contact tot conversie
              </p>
              <Button variant="link" className="px-0 mt-2" onClick={() => setActiveSection("leads")}>
                Meer leren <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automatiseer workflows en bespaar uren per week
              </p>
              <Button variant="link" className="px-0 mt-2" onClick={() => setActiveSection("automation")}>
                Meer leren <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Facturatie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Maak professionele offertes en facturen in minuten
              </p>
              <Button variant="link" className="px-0 mt-2" onClick={() => setActiveSection("invoicing")}>
                Meer leren <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function LeadsSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leads beheren</h1>
        <p className="text-muted-foreground mt-2">
          Alles over het werken met leads in StayCool CRM
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="import">Importeren</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wat zijn leads?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Leads zijn potentiële klanten die interesse hebben getoond in je diensten. 
                In StayCool CRM kun je leads door verschillende fases begeleiden:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Nieuw</Badge>
                  <span className="text-sm">Eerste contact, nog niet gekwalificeerd</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Contacteren</Badge>
                  <span className="text-sm">Klaar voor eerste gesprek</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Kwalificeren</Badge>
                  <span className="text-sm">Bepalen of het een goede match is</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Offerte</Badge>
                  <span className="text-sm">Offerte versturen</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Onderhandeling</Badge>
                  <span className="text-sm">Onderhandelen over voorwaarden</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-800">Gewonnen</Badge>
                  <span className="text-sm">Deal gesloten!</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Verloren</Badge>
                  <span className="text-sm">Helaas geen deal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead toevoegen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                  Ga naar Leads pagina
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  Klik op "Leads" in het hoofdmenu
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                  Klik op "Nieuwe Lead"
                </h4>
                <p className="text-sm text-muted-foreground ml-8">
                  De knop vind je rechtsboven op de pagina
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">3</span>
                  Vul de gegevens in
                </h4>
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground">Verplichte velden:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Naam (voor- en achternaam)</li>
                    <li>Email adres</li>
                    <li>Telefoonnummer</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">Optionele velden:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Bedrijfsnaam</li>
                    <li>Adres</li>
                    <li>Lead bron (website, telefoon, etc.)</li>
                    <li>Notities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Werken met de pipeline</CardTitle>
              <CardDescription>Visueel leads door het verkoopproces begeleiden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Pipeline weergave activeren:</p>
                <p className="text-sm text-muted-foreground">
                  Klik op het <Filter className="inline h-4 w-4" /> filter icoon en selecteer "Pipeline weergave"
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Leads verplaatsen</h4>
                <p className="text-sm text-muted-foreground">
                  Sleep leads tussen kolommen om hun status te updaten. Het systeem houdt automatisch 
                  bij wanneer en door wie de status is gewijzigd.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Bulk acties</h4>
                <p className="text-sm text-muted-foreground">
                  Selecteer meerdere leads met Shift+Click en verplaats ze tegelijk naar een nieuwe status.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads importeren</CardTitle>
              <CardDescription>Importeer bestaande leads uit CSV of Excel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-2">CSV bestand voorbereiden</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Zorg dat je CSV deze kolommen heeft: naam, email, telefoon, bedrijf (optioneel)
                </p>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download voorbeeld CSV
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Import stappen:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Ga naar Leads → Import (rechtsboven)</li>
                  <li>Upload je CSV bestand</li>
                  <li>Koppel de kolommen aan de juiste velden</li>
                  <li>Controleer de preview</li>
                  <li>Klik op "Importeren"</li>
                </ol>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Let op duplicaten</p>
                    <p className="text-yellow-700 mt-1">
                      Het systeem checkt automatisch op dubbele email adressen en slaat deze over.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pro tips voor lead management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Target className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Lead scoring gebruiken</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Geef leads een score van 1-5 sterren om prioriteit aan te geven. 
                    Workflows kunnen automatisch scores verhogen bij interacties.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Timer className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Follow-up reminders instellen</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stel taken in voor follow-ups. Het systeem stuurt je een melding 
                    zodat je nooit een lead vergeet.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Notities en activiteiten bijhouden</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log elk contact moment. Dit bouwt een complete historie op die 
                    je team helpt betere gesprekken te voeren.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">Tags voor segmentatie</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gebruik tags zoals "Residentieel", "Commercieel", "VIP" om leads 
                    te groeperen en gerichte campagnes te sturen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

function ContactsSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Contacten beheren</h1>
        <p className="text-muted-foreground mt-2">
          Beheer je klanten en hun informatie
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Verschil tussen Leads en Contacten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <UserCheck className="h-5 w-5" />
                  Leads
                </div>
                <p className="text-sm text-muted-foreground">
                  Potentiële klanten in het verkoopproces. Nog geen deal gesloten.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Users className="h-5 w-5" />
                  Contacten
                </div>
                <p className="text-sm text-muted-foreground">
                  Bestaande klanten of belangrijke contactpersonen. Hebben al zaken gedaan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead converteren naar Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">1</span>
                <div>
                  <p className="font-medium text-sm">Open de lead</p>
                  <p className="text-sm text-muted-foreground">Ga naar de lead die je wilt converteren</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">2</span>
                <div>
                  <p className="font-medium text-sm">Klik op "Converteren naar Contact"</p>
                  <p className="text-sm text-muted-foreground">Deze knop vind je rechtsboven</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">3</span>
                <div>
                  <p className="font-medium text-sm">Vul extra gegevens in</p>
                  <p className="text-sm text-muted-foreground">Zoals contract details of voorkeuren</p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact informatie beheren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Belangrijke velden</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Volledige contactgegevens (naam, email, telefoon, adres)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Bedrijfsinformatie en functie
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Contract details en voorwaarden
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Service geschiedenis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Voorkeuren en notities
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function InvoicingSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Facturatie</h1>
        <p className="text-muted-foreground mt-2">
          Maak professionele offertes en facturen
        </p>
      </div>

      <Tabs defaultValue="quotes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotes">Offertes</TabsTrigger>
          <TabsTrigger value="invoices">Facturen</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offerte maken</CardTitle>
              <CardDescription>Stap voor stap een professionele offerte opstellen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">1</span>
                  <div>
                    <p className="font-medium text-sm">Ga naar Facturatie → Nieuwe Offerte</p>
                    <p className="text-sm text-muted-foreground">Of klik op "Nieuwe Offerte" vanuit een lead</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">2</span>
                  <div>
                    <p className="font-medium text-sm">Selecteer of maak een klant</p>
                    <p className="text-sm text-muted-foreground">Begin te typen om bestaande klanten te zoeken</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">3</span>
                  <div>
                    <p className="font-medium text-sm">Voeg producten/diensten toe</p>
                    <p className="text-sm text-muted-foreground">Kies uit je productcatalogus of voeg custom items toe</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">4</span>
                  <div>
                    <p className="font-medium text-sm">Stel voorwaarden in</p>
                    <p className="text-sm text-muted-foreground">Geldigheid (standaard 30 dagen), betalingstermijn, etc.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">5</span>
                  <div>
                    <p className="font-medium text-sm">Preview en verstuur</p>
                    <p className="text-sm text-muted-foreground">Bekijk de PDF preview en mail direct naar de klant</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offerte tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">Gebruik templates</p>
                  <p className="text-sm text-muted-foreground">
                    Sla veelgebruikte product combinaties op als template voor snellere offertes
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Timer className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">Stel reminders in</p>
                  <p className="text-sm text-muted-foreground">
                    Het systeem herinnert je automatisch aan verlopen offertes voor follow-up
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">Track opening</p>
                  <p className="text-sm text-muted-foreground">
                    Zie wanneer klanten je offerte hebben geopend en hoe vaak
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Van offerte naar factuur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">One-click conversie</p>
                    <p className="text-green-700 mt-1">
                      Converteer geaccepteerde offertes met één klik naar een factuur. 
                      Alle gegevens worden automatisch overgenomen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Factuur aanmaken</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Open de geaccepteerde offerte</li>
                  <li>Klik op "Converteren naar Factuur"</li>
                  <li>Pas indien nodig details aan</li>
                  <li>Stel factuurnummer en datum in</li>
                  <li>Verstuur naar klant</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Betalingen bijhouden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Houd de status van je facturen bij:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Concept</Badge>
                  <span className="text-sm text-muted-foreground">Nog niet verstuurd</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Verstuurd</Badge>
                  <span className="text-sm text-muted-foreground">Wacht op betaling</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Betaald</Badge>
                  <span className="text-sm text-muted-foreground">Betaling ontvangen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Vervallen</Badge>
                  <span className="text-sm text-muted-foreground">Betaaltermijn verstreken</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturatie instellingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Bedrijfsgegevens</h4>
                <p className="text-sm text-muted-foreground">
                  Ga naar Instellingen → Bedrijf om je bedrijfsgegevens in te stellen. 
                  Deze worden automatisch op alle documenten geplaatst.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Nummering</h4>
                <p className="text-sm text-muted-foreground">
                  Stel je factuurnummer reeks in. Bijvoorbeeld: FAC-2024-0001
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Standaard teksten</h4>
                <p className="text-sm text-muted-foreground">
                  Configureer standaard voorwaarden, betalingstermijnen en voetteksten 
                  voor offertes en facturen.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">BTW instellingen</h4>
                <p className="text-sm text-muted-foreground">
                  Stel standaard BTW percentages in (0%, 9%, 21%) en configureer 
                  wanneer welk tarief van toepassing is.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

function AutomationSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Workflow Automation</h1>
        <p className="text-muted-foreground mt-2">
          Automatiseer terugkerende taken en bespaar tijd
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Wat is Workflow Automation?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Workflow automation zorgt ervoor dat bepaalde acties automatisch worden uitgevoerd 
              wanneer er iets gebeurt in je CRM. Denk aan:
            </p>
            
            <div className="grid gap-3">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Automatische emails</p>
                  <p className="text-sm text-muted-foreground">
                    Stuur welkom emails, follow-ups of herinneringen zonder handmatig werk
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Bell className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Taken aanmaken</p>
                  <p className="text-sm text-muted-foreground">
                    Maak automatisch taken aan voor je team bij nieuwe leads of deals
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <RefreshCw className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Status updates</p>
                  <p className="text-sm text-muted-foreground">
                    Update lead status automatisch op basis van acties of tijd
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Je eerste workflow maken</CardTitle>
            <CardDescription>Stap voor stap een automation workflow opzetten</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                  Kies een trigger
                </h4>
                <p className="text-sm text-muted-foreground ml-7">
                  Wat start de workflow? Bijvoorbeeld:
                </p>
                <ul className="text-sm text-muted-foreground ml-7 space-y-1 list-disc list-inside">
                  <li>Nieuwe lead toegevoegd</li>
                  <li>Lead status veranderd</li>
                  <li>Formulier ingevuld</li>
                  <li>Tijd verstreken</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                  Voeg acties toe
                </h4>
                <p className="text-sm text-muted-foreground ml-7">
                  Wat moet er gebeuren? Bijvoorbeeld:
                </p>
                <ul className="text-sm text-muted-foreground ml-7 space-y-1 list-disc list-inside">
                  <li>Email versturen</li>
                  <li>SMS sturen</li>
                  <li>Taak aanmaken</li>
                  <li>Lead score verhogen</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Visual Workflow Builder</h4>
              <p className="text-sm text-muted-foreground">
                Gebruik de drag-and-drop builder om workflows visueel te ontwerpen:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Ga naar Automation → Workflow Builder</li>
                <li>Sleep een trigger naar het canvas</li>
                <li>Verbind acties met lijnen</li>
                <li>Configureer elke stap in de sidebar</li>
                <li>Test je workflow met een test lead</li>
                <li>Activeer de workflow</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow voorbeelden</CardTitle>
            <CardDescription>Populaire automation scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="welcome" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="welcome">Welkom serie</TabsTrigger>
                <TabsTrigger value="nurture">Lead nurturing</TabsTrigger>
                <TabsTrigger value="followup">Follow-up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="welcome" className="space-y-3 mt-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium">Nieuwe klant welkom serie</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Direct: Welkom email met belangrijke info</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Na 1 dag: Tips om te starten</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Na 3 dagen: Check-in call taak voor sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Na 7 dagen: Tevredenheids survey</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="nurture" className="space-y-3 mt-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium">Lead kwalificatie flow</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Nieuwe lead → Welkom email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Email geopend? → Score +10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Link geklikt? → Score +20 & Sales taak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Geen reactie na 5 dagen → Andere approach</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="followup" className="space-y-3 mt-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium">Quote follow-up automation</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Offerte verstuurd → Bevestiging naar klant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Na 3 dagen → Reminder email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Na 7 dagen → Call taak voor sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Na 14 dagen → Laatste kans email</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geavanceerde features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Condities en beslissingen</h4>
              <p className="text-sm text-muted-foreground">
                Gebruik if/then logica om verschillende paden te creëren op basis van:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li>Lead eigenschappen (locatie, budget, interesse)</li>
                <li>Gedrag (email geopend, link geklikt)</li>
                <li>Tijd (werkdagen vs weekend)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Variabelen gebruiken</h4>
              <p className="text-sm text-muted-foreground">
                Personaliseer je berichten met variabelen:
              </p>
              <div className="rounded-lg border p-3 bg-muted/50 font-mono text-xs">
                <p>Beste {'{{lead.name}}'},</p>
                <p className="mt-2">Bedankt voor je interesse in {'{{product.name}}'}.</p>
                <p>We nemen binnen {'{{response.time}}'} contact op.</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Webhook integraties</h4>
              <p className="text-sm text-muted-foreground">
                Verbind externe tools zoals Zapier, Make.com of je eigen API's om:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                <li>Data te synchroniseren met andere systemen</li>
                <li>Externe acties te triggeren</li>
                <li>Informatie op te halen</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function WebhooksSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Webhook Integratie</h1>
        <p className="text-muted-foreground mt-2">
          Ontvang automatisch leads van je website formulieren
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              Wat zijn webhooks?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Webhooks zijn automatische berichten die je website naar je CRM stuurt wanneer 
              iemand een formulier invult. Zo komen nieuwe leads direct in je CRM zonder handmatig werk.
            </p>
            
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Automatische lead import</p>
                  <p className="text-muted-foreground mt-1">
                    Elke keer als iemand je contactformulier invult, wordt automatisch een nieuwe lead aangemaakt
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook instellen in 3 stappen</CardTitle>
            <CardDescription>Verbind je website formulieren met StayCool CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground shrink-0">1</span>
                <div className="flex-1">
                  <h4 className="font-medium">Ga naar Instellingen → Webhooks</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hier vind je je unieke webhook URL en secret key
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground shrink-0">2</span>
                <div className="flex-1">
                  <h4 className="font-medium">Kopieer de webhook URL</h4>
                  <div className="mt-2 rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                    https://crm.staycoolairco.nl/api/webhook/leads?tenant=JOUW_TENANT_ID
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Klik op <Copy className="inline h-3 w-3" /> om te kopiëren
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground shrink-0">3</span>
                <div className="flex-1">
                  <h4 className="font-medium">Implementeer op je website</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gebruik de voorbeeldcode (PHP, Node.js of cURL) om je formulier te koppelen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="setup" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="security">Beveiliging</TabsTrigger>
            <TabsTrigger value="testing">Testen</TabsTrigger>
            <TabsTrigger value="examples">Voorbeelden</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook configuratie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Vereiste velden</h4>
                  <p className="text-sm text-muted-foreground">
                    Deze velden moet je minimaal meesturen:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                    <li><code className="font-mono bg-muted px-1">name</code> - Naam van de lead</li>
                    <li><code className="font-mono bg-muted px-1">email</code> - Email adres</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Optionele velden</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                    <li><code className="font-mono bg-muted px-1">phone</code> - Telefoonnummer</li>
                    <li><code className="font-mono bg-muted px-1">company</code> - Bedrijfsnaam</li>
                    <li><code className="font-mono bg-muted px-1">message</code> - Bericht/notities</li>
                    <li><code className="font-mono bg-muted px-1">source</code> - Bron (bijv. "website", "landing_page")</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900">Content-Type header</p>
                      <p className="text-yellow-700 mt-1">
                        Vergeet niet <code className="font-mono bg-yellow-100 px-1">Content-Type: application/json</code> mee te sturen
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Webhook beveiliging
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <div className="flex gap-2">
                    <Shield className="h-5 w-5 text-red-600 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-900">Belangrijk: Gebruik server-side code!</p>
                      <p className="text-red-700 mt-1">
                        Je webhook secret mag NOOIT zichtbaar zijn in de browser. Gebruik altijd 
                        server-side code (PHP, Node.js, Python) voor je implementatie.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">HMAC-SHA256 Signature</h4>
                  <p className="text-sm text-muted-foreground">
                    Elke webhook request moet een signature header bevatten:
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                    X-Webhook-Signature: sha256=HASH
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Rate limiting</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    Maximum 60 requests per minuut per IP adres
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Monitoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Alle webhook requests worden gelogd. Je kunt ze bekijken in het dashboard 
                    voor troubleshooting.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook testen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Test knop in CRM</h4>
                  <p className="text-sm text-muted-foreground">
                    Gebruik de "Test Nu" knop op de webhook settings pagina om snel te testen 
                    of alles werkt.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Test met cURL</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Test vanaf je terminal met dit commando:
                  </p>
                  <div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs overflow-x-auto">
                    {`curl -X POST "https://crm.staycoolairco.nl/api/webhook/leads?tenant=JOUW_TENANT_ID" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: sha256=JOUW_SIGNATURE" \\
  -d '{"name":"Test Lead","email":"test@example.com"}'`}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Response codes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-green-100 text-green-800">201</Badge>
                      <span className="text-muted-foreground">Lead succesvol aangemaakt</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive">400</Badge>
                      <span className="text-muted-foreground">Validatie fout (missende velden)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive">401</Badge>
                      <span className="text-muted-foreground">Ongeldige signature</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">429</Badge>
                      <span className="text-muted-foreground">Rate limit overschreden</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WordPress Contact Form 7</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/50 p-4 font-mono text-xs overflow-x-auto">
                  {`// In functions.php
add_action('wpcf7_mail_sent', 'send_to_staycool_crm');

function send_to_staycool_crm($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if (!$submission) return;
    
    $posted_data = $submission->get_posted_data();
    
    $webhook_url = 'https://crm.staycoolairco.nl/api/webhook/leads?tenant=JOUW_TENANT_ID';
    $webhook_secret = 'JOUW_WEBHOOK_SECRET';
    
    $payload = [
        'name' => $posted_data['your-name'],
        'email' => $posted_data['your-email'],
        'phone' => $posted_data['your-phone'],
        'company' => $posted_data['your-company'],
        'message' => $posted_data['your-message'],
        'source' => 'contact_form_7'
    ];
    
    $json_payload = json_encode($payload);
    $signature = 'sha256=' . hash_hmac('sha256', $json_payload, $webhook_secret);
    
    wp_remote_post($webhook_url, [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-Webhook-Signature' => $signature
        ],
        'body' => $json_payload
    ]);
}`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meer voorbeelden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Op de webhook settings pagina vind je complete voorbeelden voor:
                </p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span>PHP implementatie</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span>Node.js implementatie</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>cURL/Bash scripts</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ga naar webhook settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

function AnalyticsSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Rapporten</h1>
        <p className="text-muted-foreground mt-2">
          Inzicht in je CRM prestaties en verkoop metrics
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard KPIs</CardTitle>
            <CardDescription>Belangrijke metrics op je dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Verkoop metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nieuwe leads deze maand</li>
                  <li>• Conversie ratio</li>
                  <li>• Gemiddelde deal waarde</li>
                  <li>• Verkoop pipeline waarde</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Activiteit metrics</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Openstaande taken</li>
                  <li>• Emails verstuurd</li>
                  <li>• Meetings gepland</li>
                  <li>• Follow-ups gedaan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rapporten genereren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ga naar Analytics om gedetailleerde rapporten te bekijken:
            </p>
            
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <h4 className="font-medium text-sm mb-1">Lead bronnen analyse</h4>
                <p className="text-sm text-muted-foreground">
                  Zie welke kanalen de meeste en beste leads opleveren
                </p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h4 className="font-medium text-sm mb-1">Conversie funnel</h4>
                <p className="text-sm text-muted-foreground">
                  Analyseer waar leads afhaken in het verkoop proces
                </p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h4 className="font-medium text-sm mb-1">Team prestaties</h4>
                <p className="text-sm text-muted-foreground">
                  Vergelijk prestaties van team leden
                </p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h4 className="font-medium text-sm mb-1">Revenue forecasting</h4>
                <p className="text-sm text-muted-foreground">
                  Voorspel toekomstige omzet op basis van pipeline
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function SettingsSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>
        <p className="text-muted-foreground mt-2">
          Configureer je CRM naar jouw wensen
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Belangrijke instellingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Bedrijfsgegevens</h4>
                  <p className="text-sm text-muted-foreground">
                    Logo, naam, adres, contactinfo voor documenten
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Email configuratie</h4>
                  <p className="text-sm text-muted-foreground">
                    SMTP instellingen, email templates, handtekeningen
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Gebruikers & rechten</h4>
                  <p className="text-sm text-muted-foreground">
                    Team leden toevoegen, rollen toewijzen
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Key className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">API & Integraties</h4>
                  <p className="text-sm text-muted-foreground">
                    API keys, webhooks, externe koppelingen
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Database className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Data & backup</h4>
                  <p className="text-sm text-muted-foreground">
                    Export functies, backup instellingen
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function FAQSection() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Veelgestelde vragen</h1>
        <p className="text-muted-foreground mt-2">
          Antwoorden op de meest gestelde vragen
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoe importeer ik bestaande klanten?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ga naar Leads of Contacten → Import. Upload een CSV bestand met minimaal naam, 
              email en telefoon kolommen. Het systeem helpt je met het koppelen van velden.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kan ik emails vanuit het CRM versturen?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ja! Je kunt individuele emails sturen vanuit lead/contact pagina's. Voor bulk emails 
              gebruik je Email Campaigns. Automation workflows kunnen automatische emails versturen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoe werken lead scores?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lead scores (1-5 sterren) helpen prioriteit aan te geven. Je kunt handmatig scores 
              toekennen of automation gebruiken om scores automatisch te verhogen bij interacties.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zijn mijn gegevens veilig?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Alle data wordt versleuteld opgeslagen en verzonden. We maken dagelijks backups. 
              Je kunt op elk moment je data exporteren via Instellingen → Data export.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kan ik het CRM op mobiel gebruiken?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ja, het CRM is volledig responsive en werkt op alle apparaten. Je kunt onderweg 
              leads bekijken, notities toevoegen en taken afvinken.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoe stel ik automatische herinneringen in?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bij het aanmaken van taken kun je een deadline instellen. Het systeem stuurt 
              automatisch herinneringen. Voor complexere flows gebruik je Workflow Automation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hoe krijg ik leads van mijn website in het CRM?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gebruik onze webhook integratie! Ga naar Instellingen → Webhooks, kopieer je 
              webhook URL en implementeer deze op je website met de voorbeeldcode. Elke keer 
              als iemand je contactformulier invult, wordt automatisch een lead aangemaakt.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}