"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, FileText, Send, Eye, CheckCircle, XCircle, Clock, ArrowRight, Download, Mail, Copy, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface Quote {
  id: string
  quote_number: string
  title: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted'
  issue_date: string
  valid_until?: string
  created_at: string
  items?: any[]
}

const statusConfig = {
  draft: { label: 'Concept', color: 'bg-gray-500', icon: FileText },
  sent: { label: 'Verzonden', color: 'bg-blue-500', icon: Send },
  viewed: { label: 'Bekeken', color: 'bg-yellow-500', icon: Eye },
  accepted: { label: 'Geaccepteerd', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Afgewezen', color: 'bg-red-500', icon: XCircle },
  expired: { label: 'Verlopen', color: 'bg-gray-400', icon: Clock },
  converted: { label: 'Omgezet', color: 'bg-purple-500', icon: ArrowRight }
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchTerm) params.append("search", searchTerm)

      const response = await fetch(`/api/quotes?${params}`)
      if (!response.ok) throw new Error("Failed to fetch quotes")
      
      const data = await response.json()
      setQuotes(data)
    } catch (error) {
      console.error("Error fetching quotes:", error)
      toast.error("Kon offertes niet laden")
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = quotes.filter(quote => {
    if (activeTab === "draft") return quote.status === "draft"
    if (activeTab === "sent") return ["sent", "viewed"].includes(quote.status)
    if (activeTab === "accepted") return quote.status === "accepted"
    if (activeTab === "expired") return ["expired", "rejected"].includes(quote.status)
    return true
  })

  const handleConvertToInvoice = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}/convert`, {
        method: "POST"
      })
      
      if (!response.ok) throw new Error("Failed to convert quote")
      
      const invoice = await response.json()
      toast.success(`Offerte omgezet naar factuur ${invoice.invoice_number}`)
      fetchQuotes()
      router.push(`/crm/invoices/${invoice.id}`)
    } catch (error) {
      console.error("Error converting quote:", error)
      toast.error("Kon offerte niet omzetten naar factuur")
    }
  }

  const handleDuplicate = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}/duplicate`, {
        method: "POST"
      })
      
      if (!response.ok) throw new Error("Failed to duplicate quote")
      
      const newQuote = await response.json()
      toast.success(`Offerte gedupliceerd: ${newQuote.quote_number}`)
      fetchQuotes()
    } catch (error) {
      console.error("Error duplicating quote:", error)
      toast.error("Kon offerte niet dupliceren")
    }
  }

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error("Failed to update status")
      
      toast.success("Status bijgewerkt")
      fetchQuotes()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Kon status niet bijwerken")
    }
  }

  const stats = {
    total: quotes.length,
    totalValue: quotes.reduce((sum, q) => sum + q.total_amount, 0),
    draft: quotes.filter(q => q.status === "draft").length,
    sent: quotes.filter(q => ["sent", "viewed"].includes(q.status)).length,
    accepted: quotes.filter(q => q.status === "accepted").length,
    acceptanceRate: quotes.length > 0 
      ? Math.round((quotes.filter(q => q.status === "accepted").length / quotes.filter(q => !["draft"].includes(q.status)).length) * 100) || 0
      : 0
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offertes</h1>
          <p className="text-muted-foreground">Beheer je offertes en zet ze om naar facturen</p>
        </div>
        <Button onClick={() => router.push("/crm/quotes/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Offerte
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Offertes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.draft} concept, {stats.sent} verzonden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Waarde</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Alle offertes bij elkaar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geaccepteerd</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">
              Offertes geaccepteerd
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptatie Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Van verzonden offertes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op nummer, klant of titel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter op status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="draft">Concept</SelectItem>
            <SelectItem value="sent">Verzonden</SelectItem>
            <SelectItem value="viewed">Bekeken</SelectItem>
            <SelectItem value="accepted">Geaccepteerd</SelectItem>
            <SelectItem value="rejected">Afgewezen</SelectItem>
            <SelectItem value="expired">Verlopen</SelectItem>
            <SelectItem value="converted">Omgezet</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchQuotes}>
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Alle ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Concept ({quotes.filter(q => q.status === "draft").length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Verzonden ({quotes.filter(q => ["sent", "viewed"].includes(q.status)).length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Geaccepteerd ({quotes.filter(q => q.status === "accepted").length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Verlopen/Afgewezen ({quotes.filter(q => ["expired", "rejected"].includes(q.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Geldig tot</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Geen offertes gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => {
                    const StatusIcon = statusConfig[quote.status].icon
                    const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date()
                    
                    return (
                      <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{quote.quote_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{quote.customer_name}</div>
                            {quote.customer_email && (
                              <div className="text-sm text-muted-foreground">{quote.customer_email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{quote.title}</TableCell>
                        <TableCell className="font-medium">€{quote.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[quote.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {quote.valid_until ? (
                            <div className={isExpired ? "text-red-500" : ""}>
                              {format(new Date(quote.valid_until), "dd MMM yyyy", { locale: nl })}
                              {isExpired && <span className="text-xs block">Verlopen</span>}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/crm/quotes/${quote.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/crm/quotes/${quote.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {quote.status === "accepted" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleConvertToInvoice(quote)}
                                title="Omzetten naar factuur"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicate(quote)}
                              title="Dupliceren"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}