"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Eye,
  Edit,
  FileText,
  TrendingUp,
  Calendar,
  Euro,
  Clock,
  Target,
  Percent,
  User
} from "lucide-react"

// Mock open quotes/deals data - only quotes and proposals that can become deals
const mockOpenDeals = [
  {
    id: 1,
    title: "Airco installatie Bakkerij Janssen",
    client: "Bakkerij Janssen",
    contact: "Jan Janssen",
    email: "jan@bakkerijjanssen.nl",
    phone: "+31 6 1234 5678",
    type: "quote" as const,
    status: "sent" as const,
    stage: "proposal" as const,
    value: 15750,
    probability: 75,
    expectedCloseDate: "2024-02-15",
    daysSinceQuote: 5,
    lastActivity: "Email sent",
    assignedTo: "John Doe",
    priority: "high" as const,
    notes: "Klant heeft interesse getoond. Follow-up gepland voor volgende week."
  },
  {
    id: 2,
    title: "Ventilatie systeem Café de Hoek",
    client: "Café de Hoek", 
    contact: "Lisa Smit",
    email: "lisa@cafedehoek.nl",
    phone: "+31 6 4567 8901",
    type: "quote" as const,
    status: "viewed" as const,
    stage: "negotiation" as const,
    value: 8500,
    probability: 60,
    expectedCloseDate: "2024-02-10",
    daysSinceQuote: 12,
    lastActivity: "Quote viewed",
    assignedTo: "Marie Hansen",
    priority: "medium" as const,
    notes: "Klant heeft vragen over installatie tijdlijn. Afspraak ingepland."
  },
  {
    id: 3,
    title: "Koelsysteem upgrade Restaurant Milano",
    client: "Restaurant Milano",
    contact: "Marco Rossi",
    email: "marco@milano.nl", 
    phone: "+31 6 2345 6789",
    type: "quote" as const,
    status: "sent" as const,
    stage: "qualified" as const,
    value: 22000,
    probability: 80,
    expectedCloseDate: "2024-02-20",
    daysSinceQuote: 3,
    lastActivity: "Quote sent",
    assignedTo: "John Doe",
    priority: "high" as const,
    notes: "Grote klant, goede relatie. Hoge kans op succes."
  },
  {
    id: 4,
    title: "Airco modernisering Hotel Centrum",
    client: "Hotel Centrum",
    contact: "Sandra van der Berg",
    email: "sandra@hotelcentrum.nl",
    phone: "+31 6 3456 7890",
    type: "quote" as const,
    status: "sent" as const,
    stage: "proposal" as const,
    value: 45000,
    probability: 50,
    expectedCloseDate: "2024-03-01",
    daysSinceQuote: 8,
    lastActivity: "Follow-up call",
    assignedTo: "Marie Hansen", 
    priority: "high" as const,
    notes: "Groot project. Klant vergelijkt nog met andere aanbieders."
  },
  {
    id: 5,
    title: "Kantoor airco Accountantskantoor Peters",
    client: "Accountantskantoor Peters",
    contact: "Willem Peters",
    email: "w.peters@peters-accountants.nl",
    phone: "+31 6 5678 9012",
    type: "quote" as const,
    status: "viewed" as const,
    stage: "qualified" as const,
    value: 12500,
    probability: 65,
    expectedCloseDate: "2024-02-25",
    daysSinceQuote: 15,
    lastActivity: "Email opened",
    assignedTo: "John Doe",
    priority: "medium" as const,
    notes: "Budget goedgekeurd. Wacht op definitieve beslissing van partners."
  }
]

const stageConfig = {
  qualified: { label: "Gekwalificeerd", color: "bg-blue-100 text-blue-800" },
  proposal: { label: "Offerte", color: "bg-purple-100 text-purple-800" },
  negotiation: { label: "Onderhandeling", color: "bg-orange-100 text-orange-800" }
}

const priorityConfig = {
  low: { label: "Laag", variant: "secondary" as const, color: "text-gray-500" },
  medium: { label: "Middel", variant: "default" as const, color: "text-blue-500" },
  high: { label: "Hoog", variant: "destructive" as const, color: "text-red-500" }
}

export default function DealsPage() {
  const [sortBy, setSortBy] = useState<'value' | 'probability' | 'date' | 'days'>('probability')
  const [filterStage, setFilterStage] = useState<'all' | 'qualified' | 'proposal' | 'negotiation'>('all')

  const filteredAndSortedDeals = mockOpenDeals
    .filter(deal => filterStage === 'all' || deal.stage === filterStage)
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.value - a.value
        case 'probability':
          return b.probability - a.probability
        case 'date':
          return new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime()
        case 'days':
          return a.daysSinceQuote - b.daysSinceQuote
        default:
          return 0
      }
    })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('nl-NL').format(new Date(dateString))
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return "text-green-600"
    if (days <= 14) return "text-yellow-600" 
    return "text-red-600"
  }

  const totalPipelineValue = filteredAndSortedDeals.reduce((sum, deal) => sum + deal.value, 0)
  const weightedValue = filteredAndSortedDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0)
  const averageProbability = filteredAndSortedDeals.reduce((sum, deal) => sum + deal.probability, 0) / filteredAndSortedDeals.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Open Deals</h1>
          <p className="text-muted-foreground">
            Track openstaande offertes en converteer ze naar deals
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Waarde</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredAndSortedDeals.length} open deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewogen Waarde</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weightedValue)}</div>
            <p className="text-xs text-muted-foreground">
              Gebaseerd op kans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. Kans</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageProbability)}%</div>
            <p className="text-xs text-muted-foreground">
              Over alle deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgente Opvolging</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredAndSortedDeals.filter(deal => deal.daysSinceQuote > 14).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {'>'} 14 dagen oud
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Zoek deals..." 
            className="pl-9"
          />
        </div>
        
        <Select value={filterStage} onValueChange={(value: any) => setFilterStage(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Fases</SelectItem>
            <SelectItem value="qualified">Gekwalificeerd</SelectItem>
            <SelectItem value="proposal">Offerte</SelectItem>
            <SelectItem value="negotiation">Onderhandeling</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="probability">Sort by Probability</SelectItem>
            <SelectItem value="value">Sort by Value</SelectItem>
            <SelectItem value="date">Sort by Close Date</SelectItem>
            <SelectItem value="days">Sort by Age</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Open Deals Pipeline</CardTitle>
          <CardDescription>
            Openstaande offertes die nog geconverteerd kunnen worden naar deals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{deal.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        {deal.lastActivity}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{deal.client}</div>
                      <div className="text-sm text-muted-foreground">{deal.contact}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {deal.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={stageConfig[deal.stage].color}>
                      {stageConfig[deal.stage].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(deal.value)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{deal.probability}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{formatDate(deal.expectedCloseDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getUrgencyColor(deal.daysSinceQuote)}
                    >
                      {deal.daysSinceQuote} days
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm">{deal.assignedTo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Update Stage
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          Call Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Follow-up
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-green-600">
                          <FileText className="mr-2 h-4 w-4" />
                          Convert to Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">High Probability Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAndSortedDeals
                .filter(deal => deal.probability >= 70)
                .slice(0, 3)
                .map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">{deal.client}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{deal.probability}%</span>
                      <Button size="sm" variant="outline">Follow up</Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Urgent Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAndSortedDeals
                .filter(deal => deal.daysSinceQuote > 10)
                .slice(0, 3)
                .map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium">{deal.client}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-red-600">{deal.daysSinceQuote}d</span>
                      <Button size="sm" variant="outline">Contact</Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Large Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAndSortedDeals
                .filter(deal => deal.value > 20000)
                .slice(0, 3)
                .map(deal => (
                  <div key={deal.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">{deal.client}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCurrency(deal.value)}</span>
                      <Button size="sm" variant="outline">Focus</Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}