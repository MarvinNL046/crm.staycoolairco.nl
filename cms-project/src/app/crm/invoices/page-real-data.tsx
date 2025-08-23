"use client"

import { useState, useEffect } from "react"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Download,
  Send,
  Eye,
  Edit,
  Copy,
  FileText,
  Euro,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Loader2
} from "lucide-react"

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  type: 'invoice' | 'quote'
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  client: string
  contact: string
  email: string
  total: number
  subtotal: number
  taxAmount: number
  currency: string
  issueDate: string
  dueDate: string | null
  paidDate: string | null
  quoteValidUntil?: string | null
  items: InvoiceItem[]
  notes?: string
  paymentTerms?: string
}

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: Edit, color: "text-gray-500" },
  sent: { label: "Sent", variant: "default" as const, icon: Send, color: "text-blue-500" },
  viewed: { label: "Viewed", variant: "default" as const, icon: Eye, color: "text-purple-500" },
  paid: { label: "Paid", variant: "default" as const, icon: CheckCircle, color: "text-green-500" },
  overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle, color: "text-red-500" },
  cancelled: { label: "Cancelled", variant: "secondary" as const, icon: XCircle, color: "text-gray-500" }
}

const typeConfig = {
  quote: { label: "Quote", color: "bg-blue-100 text-blue-800" },
  invoice: { label: "Invoice", color: "bg-green-100 text-green-800" },
  credit_note: { label: "Credit Note", color: "bg-red-100 text-red-800" }
}

export default function InvoicesPageRealData() {
  const [activeTab, setActiveTab] = useState<'all' | 'quotes' | 'invoices'>('all')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch invoices from API
  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true)
        const response = await fetch('/api/invoices?tenant_id=80496bff-b559-4b80-9102-3a84afdaa616')
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoices')
        }
        
        const data = await response.json()
        setInvoices(data.invoices || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError('Failed to load invoices. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const filteredInvoices = invoices.filter(invoice => {
    if (activeTab === 'quotes') return invoice.type === 'quote'
    if (activeTab === 'invoices') return invoice.type === 'invoice'
    return true
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

  // Calculate stats from real data
  const stats = {
    totalOutstanding: invoices
      .filter(inv => ['sent', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0),
    thisMonth: invoices
      .filter(inv => {
        const issueDate = new Date(inv.issueDate)
        const now = new Date()
        return issueDate.getMonth() === now.getMonth() && issueDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, inv) => sum + inv.total, 0),
    overdue: invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingQuotes: invoices
      .filter(inv => inv.type === 'quote' && ['sent', 'draft'].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0),
    overdueCount: invoices.filter(inv => inv.status === 'overdue').length,
    pendingQuotesCount: invoices.filter(inv => inv.type === 'quote' && ['sent', 'draft'].includes(inv.status)).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invoices...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Invoices</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices & Quotes</h1>
          <p className="text-muted-foreground">
            Manage your invoices and quotes - Real CRM Data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <a href="/crm/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              From {invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).length} unpaid invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Current month revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} invoice{stats.overdueCount !== 1 ? 's' : ''} overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingQuotes)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingQuotesCount} quote{stats.pendingQuotesCount !== 1 ? 's' : ''} awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search invoices..." 
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">
            Quotes ({invoices.filter(i => i.type === 'quote').length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices ({invoices.filter(i => i.type === 'invoice').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' && 'All Documents'}
                {activeTab === 'quotes' && 'Quotes'}
                {activeTab === 'invoices' && 'Invoices'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'all' && 'Overview of all invoices and quotes from Staycool CRM'}
                {activeTab === 'quotes' && 'Manage your quotes and proposals'}
                {activeTab === 'invoices' && 'Track your invoices and payments'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' && 'No invoices or quotes have been created yet.'}
                    {activeTab === 'quotes' && 'No quotes have been created yet.'}
                    {activeTab === 'invoices' && 'No invoices have been created yet.'}
                  </p>
                  <Button asChild>
                    <a href="/crm/invoices/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First {activeTab === 'quotes' ? 'Quote' : activeTab === 'invoices' ? 'Invoice' : 'Document'}
                    </a>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const StatusIcon = statusConfig[invoice.status].icon
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeConfig[invoice.type].color}>
                              {typeConfig[invoice.type].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.client}</div>
                              <div className="text-sm text-muted-foreground">{invoice.contact}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={invoice.title}>
                              {invoice.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${statusConfig[invoice.status].color}`} />
                              <Badge variant={statusConfig[invoice.status].variant}>
                                {statusConfig[invoice.status].label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.total)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invoice.issueDate)}
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
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send by Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}