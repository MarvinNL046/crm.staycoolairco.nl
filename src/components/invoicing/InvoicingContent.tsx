'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, FileSearch, Euro, Calendar, Search, Filter, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function InvoicingContent() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0
  })

  useEffect(() => {
    fetchInvoices()
  }, [filter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()
      setInvoices(data)
      
      // Calculate stats
      const stats = data.reduce((acc: any, inv: any) => {
        acc.total += parseFloat(inv.total_amount || 0)
        if (inv.status === 'paid') acc.paid += parseFloat(inv.total_amount || 0)
        if (inv.status === 'sent') acc.pending += parseFloat(inv.total_amount || 0)
        if (inv.status === 'overdue') acc.overdue += parseFloat(inv.total_amount || 0)
        return acc
      }, { total: 0, paid: 0, pending: 0, overdue: 0 })
      
      setStats(stats)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
      overdue: 'bg-red-500/10 text-red-600 dark:text-red-400',
      cancelled: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      expired: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
    }
    return statusColors[status] || 'bg-muted text-muted-foreground'
  }

  const getTypeIcon = (type: string) => {
    if (type === 'quote') return <FileSearch className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nl-NL')
  }

  const filteredInvoices = invoices.filter((invoice: any) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        invoice.invoice_number?.toLowerCase().includes(search) ||
        invoice.customer_name?.toLowerCase().includes(search) ||
        invoice.customer_email?.toLowerCase().includes(search) ||
        invoice.customer_company?.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturatie</h1>
          <p className="mt-1 text-muted-foreground">Beheer facturen en offertes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/invoicing/new?type=quote" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Nieuwe Offerte
            </Link>
          </Button>
          <Button asChild>
            <Link href="/invoicing/new?type=invoice" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nieuwe Factuur
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">Alle facturen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betaald</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Euro className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground">Ontvangen betalingen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaand</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Euro className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground">In afwachting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verlopen</CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Euro className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.overdue)}</div>
            <p className="text-xs text-muted-foreground">Te laat betaald</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Zoek op nummer, klant of bedrijf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="draft">Concept</SelectItem>
                  <SelectItem value="sent">Verzonden</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                  <SelectItem value="overdue">Verlopen</SelectItem>
                  <SelectItem value="cancelled">Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Invoice List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Nummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Klant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Bedrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-muted rounded h-4 w-4"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-muted rounded h-4 w-24"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="animate-pulse bg-muted rounded h-4 w-32"></div>
                          <div className="animate-pulse bg-muted rounded h-3 w-24"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-muted rounded h-4 w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-muted rounded h-4 w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-muted rounded-full h-5 w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-muted rounded h-4 w-4"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                      Geen facturen gevonden
                    </td>
                  </tr>
              ) : (
                filteredInvoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(invoice.invoice_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {invoice.invoice_number}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{invoice.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.customer_company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{formatDate(invoice.issue_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {formatCurrency(invoice.total_amount)}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                          getStatusColor(invoice.status)
                        )}>
                        {invoice.status === 'draft' && 'Concept'}
                        {invoice.status === 'sent' && 'Verzonden'}
                        {invoice.status === 'paid' && 'Betaald'}
                        {invoice.status === 'overdue' && 'Verlopen'}
                        {invoice.status === 'cancelled' && 'Geannuleerd'}
                        {invoice.status === 'expired' && 'Verlopen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/invoicing/${invoice.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}