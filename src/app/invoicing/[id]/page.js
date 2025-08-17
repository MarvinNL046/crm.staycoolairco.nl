'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Send, Edit, Trash2, FileText, Euro, Calendar, Printer, Mail, Copy } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'

export default function InvoiceDetailPage() {
  const { colors, resolvedTheme } = useTheme()
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${params.id}`)
      if (!response.ok) {
        throw new Error('Invoice not found')
      }
      const data = await response.json()
      setInvoice(data)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      router.push('/invoicing')
    } finally {
      setLoading(false)
    }
  }

  const deleteInvoice = async () => {
    if (!confirm('Weet je zeker dat je deze factuur wilt verwijderen?')) return
    
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/invoicing')
      } else {
        throw new Error('Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Er is een fout opgetreden bij het verwijderen van de factuur')
    }
  }

  const updateStatus = async (newStatus) => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
        })
      })
      
      if (response.ok) {
        fetchInvoice()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Er is een fout opgetreden bij het updaten van de status')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const isDark = resolvedTheme === 'dark'
    const statusColors = {
      draft: isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700',
      sent: isDark ? 'bg-primary-900/30 text-primary-400' : 'bg-primary-100 text-primary-700',
      paid: isDark ? 'bg-success-900/30 text-success-400' : 'bg-success-100 text-success-700',
      overdue: isDark ? 'bg-error-900/30 text-error-400' : 'bg-error-100 text-error-700',
      cancelled: isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-500',
      expired: isDark ? 'bg-warning-900/30 text-warning-400' : 'bg-warning-100 text-warning-700'
    }
    return statusColors[status] || (isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700')
  }

  const getStatusText = (status) => {
    const texts = {
      draft: 'Concept',
      sent: 'Verzonden',
      paid: 'Betaald',
      overdue: 'Verlopen',
      cancelled: 'Geannuleerd',
      expired: 'Verlopen'
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.secondary }}>
        <div style={{ color: colors.text.secondary }}>Laden...</div>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  const isQuote = invoice.invoice_type === 'quote'

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/invoicing" 
              className="transition-colors"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.text.secondary}
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {isQuote ? 'Offerte' : 'Factuur'} {invoice.invoice_number}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {getStatusText(invoice.status)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {invoice.status === 'draft' && (
              <button
                onClick={() => updateStatus('sent')}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors"
                style={{ backgroundColor: colors.interactive.primary }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.interactive.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.interactive.primary}
              >
                <Send className="h-4 w-4" />
                Versturen
              </button>
            )}
            
            {invoice.status === 'sent' && !isQuote && (
              <button
                onClick={() => updateStatus('paid')}
                className="px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors"
                style={{ backgroundColor: colors.status.success }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.status.success}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.status.success}
              >
                <Euro className="h-4 w-4" />
                Markeer als betaald
              </button>
            )}
            
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              style={{ 
                backgroundColor: colors.background.elevated,
                color: colors.text.primary,
                border: `1px solid ${colors.border.primary}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.interactive.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.background.elevated}
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            
            <button
              onClick={deleteInvoice}
              className="px-4 py-2 transition-colors"
              style={{ color: colors.interactive.danger }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.interactive.dangerHover}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.interactive.danger}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="rounded-lg shadow-sm print:shadow-none" style={{ backgroundColor: colors.background.elevated }}>
          <div className="p-8">
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>Stay Cool Air</h2>
                <p style={{ color: colors.text.secondary }}>Airconditioning & Warmtepompen</p>
                <p className="text-sm mt-2" style={{ color: colors.text.tertiary }}>
                  KvK: 12345678<br />
                  BTW: NL123456789B01
                </p>
              </div>
              
              <div className="text-right">
                <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
                  {isQuote ? 'OFFERTE' : 'FACTUUR'}
                </h3>
                <p className="text-lg font-medium" style={{ color: colors.text.primary }}>{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Factuuradres</h4>
                <div style={{ color: colors.text.primary }}>
                  <p className="font-medium">{invoice.customer_name}</p>
                  {invoice.customer_company && <p>{invoice.customer_company}</p>}
                  {invoice.billing_address_line1 && <p>{invoice.billing_address_line1}</p>}
                  {invoice.billing_address_line2 && <p>{invoice.billing_address_line2}</p>}
                  {(invoice.billing_postal_code || invoice.billing_city) && (
                    <p>{invoice.billing_postal_code} {invoice.billing_city}</p>
                  )}
                  {invoice.billing_country && <p>{invoice.billing_country}</p>}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Factuurgegevens</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span style={{ color: colors.text.secondary }}>Datum:</span>
                    <span className="font-medium" style={{ color: colors.text.primary }}>{formatDate(invoice.issue_date)}</span>
                  </div>
                  {isQuote ? (
                    <div className="flex justify-between">
                      <span style={{ color: colors.text.secondary }}>Geldig tot:</span>
                      <span className="font-medium" style={{ color: colors.text.primary }}>{formatDate(invoice.quote_valid_until)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span style={{ color: colors.text.secondary }}>Vervaldatum:</span>
                        <span className="font-medium" style={{ color: colors.text.primary }}>{formatDate(invoice.due_date)}</span>
                      </div>
                      {invoice.paid_date && (
                        <div className="flex justify-between">
                          <span style={{ color: colors.text.secondary }}>Betaald op:</span>
                          <span className="font-medium" style={{ color: colors.text.primary }}>{formatDate(invoice.paid_date)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border.primary}` }}>
                    <th className="text-left py-3 px-2" style={{ color: colors.text.primary }}>Omschrijving</th>
                    <th className="text-right py-3 px-2 w-20" style={{ color: colors.text.primary }}>Aantal</th>
                    <th className="text-right py-3 px-2 w-32" style={{ color: colors.text.primary }}>Prijs</th>
                    <th className="text-right py-3 px-2 w-20" style={{ color: colors.text.primary }}>BTW</th>
                    <th className="text-right py-3 px-2 w-32" style={{ color: colors.text.primary }}>Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items?.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${colors.border.primary}` }}>
                      <td className="py-3 px-2">
                        <p className="font-medium" style={{ color: colors.text.primary }}>{item.name}</p>
                        {item.description && (
                          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>{item.description}</p>
                        )}
                      </td>
                      <td className="text-right py-3 px-2" style={{ color: colors.text.primary }}>{item.quantity}</td>
                      <td className="text-right py-3 px-2" style={{ color: colors.text.primary }}>{formatCurrency(item.unit_price)}</td>
                      <td className="text-right py-3 px-2" style={{ color: colors.text.primary }}>{item.tax_rate}%</td>
                      <td className="text-right py-3 px-2 font-medium" style={{ color: colors.text.primary }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="space-y-1">
                  <div className="flex justify-between py-1">
                    <span style={{ color: colors.text.secondary }}>Subtotaal</span>
                    <span style={{ color: colors.text.primary }}>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between py-1">
                      <span style={{ color: colors.text.secondary }}>Korting</span>
                      <span style={{ color: colors.text.primary }}>-{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span style={{ color: colors.text.secondary }}>BTW</span>
                    <span style={{ color: colors.text.primary }}>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-lg" style={{ borderTop: `2px solid ${colors.border.primary}` }}>
                    <span style={{ color: colors.text.primary }}>Totaal</span>
                    <span style={{ color: colors.text.primary }}>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h4 className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>Opmerkingen</h4>
                <p className="whitespace-pre-wrap" style={{ color: colors.text.primary }}>{invoice.notes}</p>
              </div>
            )}

            {/* Payment Terms */}
            <div className="pt-6 text-sm" style={{ borderTop: `1px solid ${colors.border.primary}`, color: colors.text.secondary }}>
              <p><strong>Betalingsvoorwaarden:</strong> {invoice.payment_terms}</p>
              <p className="mt-2">
                Gelieve het totaalbedrag over te maken naar:<br />
                IBAN: NL12 ABCD 0123 4567 89<br />
                t.n.v. Stay Cool Air B.V.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}