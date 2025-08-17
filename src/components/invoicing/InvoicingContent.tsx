'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, FileSearch, Euro, Calendar, Search, Filter, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'

export default function InvoicingContent() {
  const { colors, resolvedTheme } = useTheme()
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
    const isDark = resolvedTheme === 'dark'
    const statusColors: { [key: string]: string } = {
      draft: isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700',
      sent: isDark ? 'bg-primary-900/30 text-primary-400' : 'bg-primary-100 text-primary-700',
      paid: isDark ? 'bg-success-900/30 text-success-400' : 'bg-success-100 text-success-700',
      overdue: isDark ? 'bg-error-900/30 text-error-400' : 'bg-error-100 text-error-700',
      cancelled: isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-500',
      expired: isDark ? 'bg-warning-900/30 text-warning-400' : 'bg-warning-100 text-warning-700'
    }
    return statusColors[status] || (isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700')
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
          <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>Facturatie</h1>
          <p className="mt-1" style={{ color: colors.text.secondary }}>Beheer facturen en offertes</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/invoicing/new?type=quote"
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            style={{ 
              backgroundColor: colors.interactive.secondary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.primary}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.interactive.secondaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.interactive.secondary}
          >
            <FileSearch className="h-5 w-5" />
            Nieuwe Offerte
          </Link>
          <Link
            href="/invoicing/new?type=invoice"
            className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors"
            style={{ 
              backgroundColor: colors.interactive.primary
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.interactive.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.interactive.primary}
          >
            <Plus className="h-5 w-5" />
            Nieuwe Factuur
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: colors.background.elevated }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Totaal</p>
              <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>{formatCurrency(stats.total)}</p>
            </div>
            <Euro className="h-8 w-8" style={{ color: colors.text.tertiary }} />
          </div>
        </div>
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: colors.background.elevated }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Betaald</p>
              <p className="text-2xl font-bold" style={{ color: colors.status.success }}>{formatCurrency(stats.paid)}</p>
            </div>
            <Euro className="h-8 w-8" style={{ color: colors.status.success, opacity: 0.5 }} />
          </div>
        </div>
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: colors.background.elevated }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Openstaand</p>
              <p className="text-2xl font-bold" style={{ color: colors.status.info }}>{formatCurrency(stats.pending)}</p>
            </div>
            <Euro className="h-8 w-8" style={{ color: colors.status.info, opacity: 0.5 }} />
          </div>
        </div>
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: colors.background.elevated }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.secondary }}>Verlopen</p>
              <p className="text-2xl font-bold" style={{ color: colors.status.error }}>{formatCurrency(stats.overdue)}</p>
            </div>
            <Euro className="h-8 w-8" style={{ color: colors.status.error, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg shadow mb-6" style={{ backgroundColor: colors.background.elevated }}>
        <div className="p-4" style={{ borderBottom: `1px solid ${colors.border.primary}` }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.text.tertiary }} />
                <input
                  type="text"
                  placeholder="Zoek op nummer, klant of bedrijf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: colors.background.input,
                    border: `1px solid ${colors.border.input}`,
                    color: colors.text.primary,
                    ['--tw-ring-color' as any]: colors.border.focus
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: colors.background.input,
                  border: `1px solid ${colors.border.input}`,
                  color: colors.text.primary,
                  ['--tw-ring-color' as any]: colors.border.focus
                }}
              >
                <option value="all">Alle statussen</option>
                <option value="draft">Concept</option>
                <option value="sent">Verzonden</option>
                <option value="paid">Betaald</option>
                <option value="overdue">Verlopen</option>
                <option value="cancelled">Geannuleerd</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: colors.background.secondary, borderBottom: `1px solid ${colors.border.primary}` }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Nummer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Klant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Bedrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                  
                </th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: colors.background.elevated }}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center" style={{ color: colors.text.secondary }}>
                    Laden...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center" style={{ color: colors.text.secondary }}>
                    Geen facturen gevonden
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="transition-colors" style={{ borderBottom: `1px solid ${colors.border.primary}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.secondary} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(invoice.invoice_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: colors.text.primary }}>{invoice.customer_name}</div>
                      <div className="text-sm" style={{ color: colors.text.secondary }}>{invoice.customer_company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: colors.text.primary }}>{formatDate(invoice.issue_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
                        {formatCurrency(invoice.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status === 'draft' && 'Concept'}
                        {invoice.status === 'sent' && 'Verzonden'}
                        {invoice.status === 'paid' && 'Betaald'}
                        {invoice.status === 'overdue' && 'Verlopen'}
                        {invoice.status === 'cancelled' && 'Geannuleerd'}
                        {invoice.status === 'expired' && 'Verlopen'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/invoicing/${invoice.id}`}
                        className="transition-colors"
                        style={{ color: colors.interactive.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.color = colors.interactive.primaryHover}
                        onMouseLeave={(e) => e.currentTarget.style.color = colors.interactive.primary}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}