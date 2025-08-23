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
  XCircle
} from "lucide-react"

// Mock invoices data
const mockInvoices = [
  {
    id: 1,
    invoiceNumber: "INV-2024-001",
    title: "Airco installatie Restaurant Groen",
    type: "invoice" as const,
    status: "paid" as const,
    client: "Restaurant Groen",
    contact: "Maria de Groot",
    email: "maria@restaurantgroen.nl",
    total: 28500,
    subtotal: 23553.72,
    taxAmount: 4946.28,
    currency: "EUR",
    issueDate: "2024-01-15",
    dueDate: "2024-02-14",
    paidDate: "2024-02-10",
    items: [
      { description: "Split unit airco 3.5kW", quantity: 2, unitPrice: 850, total: 1700 },
      { description: "Installatie en montage", quantity: 8, unitPrice: 75, total: 600 },
      { description: "Materialen en toebehoren", quantity: 1, unitPrice: 450, total: 450 }
    ]
  },
  {
    id: 2,
    invoiceNumber: "QUO-2024-008",
    title: "Offerte Bakkerij Janssen - Koelsysteem",
    type: "quote" as const,
    status: "sent" as const,
    client: "Bakkerij Janssen",
    contact: "Jan Janssen",
    email: "jan@bakkerijjanssen.nl",
    total: 15750,
    subtotal: 13016.53,
    taxAmount: 2733.47,
    currency: "EUR",
    issueDate: "2024-01-20",
    dueDate: "2024-02-19",
    paidDate: null,
    items: [
      { description: "Koelunit voor vitrine 2.5kW", quantity: 1, unitPrice: 1200, total: 1200 },
      { description: "Installatie koelsysteem", quantity: 6, unitPrice: 85, total: 510 },
      { description: "Jaarlijks onderhoud (3 jaar)", quantity: 3, unitPrice: 150, total: 450 }
    ]
  },
  {
    id: 3,
    invoiceNumber: "INV-2024-002",
    title: "Onderhoud Hotel Zonneschijn",
    type: "invoice" as const,
    status: "overdue" as const,
    client: "Hotel Zonneschijn",
    contact: "Peter van Dam",
    email: "peter@hotelzonneschijn.nl",
    total: 3250,
    subtotal: 2685.95,
    taxAmount: 564.05,
    currency: "EUR",
    issueDate: "2024-01-05",
    dueDate: "2024-01-25",
    paidDate: null,
    items: [
      { description: "Kwartaal onderhoud 12 units", quantity: 12, unitPrice: 45, total: 540 },
      { description: "Vervangingsonderdelen", quantity: 1, unitPrice: 180, total: 180 }
    ]
  },
  {
    id: 4,
    invoiceNumber: "QUO-2024-009",
    title: "Offerte Café de Hoek - Ventilatie",
    type: "quote" as const,
    status: "draft" as const,
    client: "Café de Hoek",
    contact: "Lisa Smit",
    email: "lisa@cafedehoek.nl",
    total: 8500,
    subtotal: 7024.79,
    taxAmount: 1475.21,
    currency: "EUR",
    issueDate: "2024-01-22",
    dueDate: "2024-02-21",
    paidDate: null,
    items: [
      { description: "Ventilatie systeem horeca", quantity: 1, unitPrice: 650, total: 650 },
      { description: "Installatie en inregeling", quantity: 4, unitPrice: 95, total: 380 }
    ]
  }
]

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

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'quotes' | 'invoices'>('all')

  const filteredInvoices = mockInvoices.filter(invoice => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices & Quotes</h1>
          <p className="text-muted-foreground">
            Manage your invoices and quotes
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€47,250</div>
            <p className="text-xs text-muted-foreground">
              From 8 unpaid invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€28,500</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€3,250</div>
            <p className="text-xs text-muted-foreground">
              1 invoice overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€24,250</div>
            <p className="text-xs text-muted-foreground">
              2 quotes awaiting response
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
          <TabsTrigger value="all">All ({mockInvoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">
            Quotes ({mockInvoices.filter(i => i.type === 'quote').length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices ({mockInvoices.filter(i => i.type === 'invoice').length})
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
                {activeTab === 'all' && 'Overview of all invoices and quotes'}
                {activeTab === 'quotes' && 'Manage your quotes and proposals'}
                {activeTab === 'invoices' && 'Track your invoices and payments'}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}