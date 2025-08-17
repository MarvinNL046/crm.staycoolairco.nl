'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react'
import Link from 'next/link'
import CustomerSelector from '@/components/invoices/CustomerSelector'
import { useToast } from '@/components/ui/use-toast'

interface InvoiceItem {
  id: number
  name: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

export default function NewInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceType = searchParams.get('type') || 'invoice'
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; type: 'lead' | 'contact' } | null>(null)
  
  const [invoice, setInvoice] = useState({
    invoice_type: invoiceType,
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    quote_valid_until: invoiceType === 'quote' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_company: '',
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: 'Nederland',
    tax_rate: 21,
    payment_terms: '30 dagen netto',
    notes: '',
    lead_id: null as string | null,
    contact_id: null as string | null
  })
  
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 21
    }
  ])

  const handleCustomerSelect = async (customer: { id: string; type: 'lead' | 'contact' } | null) => {
    if (!customer) {
      setSelectedCustomer(null)
      setInvoice({
        ...invoice,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_company: '',
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        billing_country: 'Nederland',
        lead_id: null,
        contact_id: null
      })
      return
    }

    setSelectedCustomer(customer)
    
    // Fetch customer details
    try {
      const endpoint = customer.type === 'lead' ? `/api/leads/${customer.id}` : `/api/contacts/${customer.id}`
      const response = await fetch(endpoint)
      const data = await response.json()
      
      setInvoice({
        ...invoice,
        customer_name: data.name || '',
        customer_email: data.email || '',
        customer_phone: data.phone || '',
        customer_company: data.company || '',
        billing_address_line1: data.street ? `${data.street} ${data.house_number || ''}`.trim() : '',
        billing_city: data.city || '',
        billing_state: data.province || '',
        billing_postal_code: data.postal_code || '',
        billing_country: data.country || 'Nederland',
        lead_id: customer.type === 'lead' ? customer.id : null,
        contact_id: customer.type === 'contact' ? customer.id : null
      })
    } catch (error) {
      console.error('Error fetching customer details:', error)
      toast({
        title: "Fout bij ophalen klantgegevens",
        description: "Kon klantgegevens niet laden",
        variant: "destructive"
      })
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 21
      }
    ])
  }

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const calculateTotals = () => {
    let subtotal = 0
    let taxAmount = 0
    
    items.forEach(item => {
      const itemSubtotal = item.quantity * item.unit_price
      const itemTax = itemSubtotal * (item.tax_rate / 100)
      subtotal += itemSubtotal
      taxAmount += itemTax
    })
    
    const total = subtotal + taxAmount
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2)
    }
  }

  const saveInvoice = async (sendAfterSave = false) => {
    try {
      setLoading(true)
      
      // Validate required fields
      if (!invoice.customer_name) {
        toast({
          title: "Klant vereist",
          description: "Selecteer een klant voor deze factuur",
          variant: "destructive"
        })
        return
      }

      // Create invoice
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invoice,
          status: sendAfterSave ? 'sent' : 'draft'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create invoice')
      }
      
      const createdInvoice = await response.json()
      
      // Add items
      for (const item of items) {
        if (item.name && item.unit_price > 0) {
          await fetch(`/api/invoices/${createdInvoice.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate
            })
          })
        }
      }
      
      toast({
        title: `${invoiceType === 'quote' ? 'Offerte' : 'Factuur'} aangemaakt`,
        description: `${invoiceType === 'quote' ? 'Offerte' : 'Factuur'} is succesvol ${sendAfterSave ? 'verzonden' : 'opgeslagen als concept'}`,
      })
      
      router.push(`/invoicing/${createdInvoice.id}`)
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "Fout bij opslaan",
        description: `Er is een fout opgetreden bij het opslaan van de ${invoiceType === 'quote' ? 'offerte' : 'factuur'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invoicing" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold">
            Nieuwe {invoiceType === 'quote' ? 'Offerte' : 'Factuur'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Klantgegevens</h2>
              <CustomerSelector
                value={selectedCustomer}
                onChange={handleCustomerSelect}
                placeholder="Zoek klant of lead..."
                required
              />
              
              {/* Display selected customer info */}
              {invoice.customer_name && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Klant</p>
                      <p className="font-medium">{invoice.customer_name}</p>
                      {invoice.customer_company && (
                        <p className="text-sm text-muted-foreground">{invoice.customer_company}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact</p>
                      {invoice.customer_email && (
                        <p className="text-sm">{invoice.customer_email}</p>
                      )}
                      {invoice.customer_phone && (
                        <p className="text-sm">{invoice.customer_phone}</p>
                      )}
                    </div>
                    {invoice.billing_address_line1 && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Factuuradres</p>
                        <p className="text-sm">{invoice.billing_address_line1}</p>
                        {invoice.billing_address_line2 && (
                          <p className="text-sm">{invoice.billing_address_line2}</p>
                        )}
                        <p className="text-sm">
                          {[invoice.billing_postal_code, invoice.billing_city, invoice.billing_state]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                        {invoice.billing_country && invoice.billing_country !== 'Nederland' && (
                          <p className="text-sm">{invoice.billing_country}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Factuurgegevens</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Factuurdatum
                  </label>
                  <input
                    type="date"
                    value={invoice.issue_date}
                    onChange={(e) => setInvoice({ ...invoice, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                {invoiceType === 'invoice' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Vervaldatum
                    </label>
                    <input
                      type="date"
                      value={invoice.due_date}
                      onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Geldig tot
                    </label>
                    <input
                      type="date"
                      value={invoice.quote_valid_until || ''}
                      onChange={(e) => setInvoice({ ...invoice, quote_valid_until: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Betalingstermijn
                  </label>
                  <input
                    type="text"
                    value={invoice.payment_terms}
                    onChange={(e) => setInvoice({ ...invoice, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Regels</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Omschrijving</th>
                      <th className="text-left py-2 px-2 w-20">Aantal</th>
                      <th className="text-left py-2 px-2 w-32">Prijs</th>
                      <th className="text-left py-2 px-2 w-20">BTW%</th>
                      <th className="text-right py-2 px-2 w-32">Totaal</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const itemTotal = item.quantity * item.unit_price * (1 + item.tax_rate / 100)
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              placeholder="Product/dienst naam"
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <textarea
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Beschrijving (optioneel)"
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary mt-1 text-sm"
                              rows={2}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.tax_rate}
                              onChange={(e) => updateItem(item.id, 'tax_rate', parseFloat(e.target.value))}
                              className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="0">0%</option>
                              <option value="9">9%</option>
                              <option value="21">21%</option>
                            </select>
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            €{itemTotal.toFixed(2)}
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive/80"
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <button
                onClick={addItem}
                className="mt-4 px-4 py-2 text-primary hover:text-primary/80 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Regel toevoegen
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Opmerkingen
              </label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Opmerkingen die op de factuur komen..."
              />
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotaal</span>
                  <span>€{totals.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>BTW</span>
                  <span>€{totals.taxAmount}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Totaal</span>
                  <span>€{totals.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t px-6 py-4 bg-muted/50 flex justify-between">
            <Link
              href="/invoicing"
              className="px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Annuleren
            </Link>
            <div className="flex gap-3">
              <button
                onClick={() => saveInvoice(false)}
                disabled={loading || !invoice.customer_name}
                className="px-4 py-2 bg-background border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Opslaan als concept
              </button>
              <button
                onClick={() => saveInvoice(true)}
                disabled={loading || !invoice.customer_name}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Opslaan en versturen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}