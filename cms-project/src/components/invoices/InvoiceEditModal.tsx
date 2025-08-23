"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingButton } from "@/components/ui/loading-states"
import { Plus, Trash2, Calculator, Save, X } from "lucide-react"
import { toast } from "sonner"

interface InvoiceItem {
  id?: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount?: number
  discountPercentage?: number
  total: number
  position?: number
  productId?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'invoice' | 'quote'
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'accepted' | 'converted'
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCompany?: string
  billingAddressLine1?: string
  billingAddressLine2?: string
  billingCity?: string
  billingState?: string
  billingPostalCode?: string
  billingCountry?: string
  issueDate: string
  dueDate?: string
  quoteValidUntil?: string
  paidDate?: string
  currency: string
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount?: number
  discountPercentage?: number
  totalAmount: number
  notes?: string
  internalNotes?: string
  paymentTerms?: string
  paymentMethod?: string
  items: InvoiceItem[]
}

interface InvoiceEditModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onSave: (invoice: Invoice) => void
}

export function InvoiceEditModal({ invoice, open, onClose, onSave }: InvoiceEditModalProps) {
  const [formData, setFormData] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  // Initialize form data when invoice changes
  useEffect(() => {
    if (invoice) {
      setFormData({ ...invoice })
    } else {
      setFormData(null)
    }
  }, [invoice])

  const calculateItemTotals = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice
    const discountAmount = (subtotal * (item.discountPercentage || 0)) / 100
    const subtotalAfterDiscount = subtotal - discountAmount
    const taxAmount = (subtotalAfterDiscount * (item.taxRate || 21)) / 100
    const total = subtotalAfterDiscount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!formData) return

    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate totals for this item
    const calculations = calculateItemTotals(updatedItems[index])
    updatedItems[index] = { 
      ...updatedItems[index], 
      ...calculations 
    }

    // Recalculate invoice totals
    const invoiceSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
    const invoiceTaxAmount = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0)
    const invoiceTotal = updatedItems.reduce((sum, item) => sum + item.total, 0)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal: invoiceSubtotal,
      taxAmount: invoiceTaxAmount,
      totalAmount: invoiceTotal
    })
  }

  const addItem = () => {
    if (!formData) return

    const newItem: InvoiceItem = {
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
      taxRate: 21,
      taxAmount: 0,
      discountAmount: 0,
      discountPercentage: 0,
      total: 0,
      position: formData.items.length + 1
    }

    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    })
  }

  const removeItem = (index: number) => {
    if (!formData) return

    const updatedItems = formData.items.filter((_, i) => i !== index)
    
    // Recalculate invoice totals
    const invoiceSubtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0)
    const invoiceTaxAmount = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0)
    const invoiceTotal = updatedItems.reduce((sum, item) => sum + item.total, 0)

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal: invoiceSubtotal,
      taxAmount: invoiceTaxAmount,
      totalAmount: invoiceTotal
    })
  }

  const handleSave = async () => {
    if (!formData) return

    setLoading(true)
    try {
      // Transform data to match API expectations
      const updateData = {
        type: formData.type,
        status: formData.status,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || null,
        customerCompany: formData.customerCompany || null,
        billingAddressLine1: formData.billingAddressLine1 || null,
        billingAddressLine2: formData.billingAddressLine2 || null,
        billingCity: formData.billingCity || null,
        billingState: formData.billingState || null,
        billingPostalCode: formData.billingPostalCode || null,
        billingCountry: formData.billingCountry || null,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate || null,
        quoteValidUntil: formData.quoteValidUntil || null,
        paidDate: formData.paidDate || null,
        currency: formData.currency || 'EUR',
        subtotal: formData.subtotal,
        taxRate: formData.taxRate || 21,
        taxAmount: formData.taxAmount,
        discountAmount: formData.discountAmount || 0,
        discountPercentage: formData.discountPercentage || 0,
        totalAmount: formData.totalAmount,
        notes: formData.notes || null,
        internalNotes: formData.internalNotes || null,
        paymentTerms: formData.paymentTerms || null,
        paymentMethod: formData.paymentMethod || null,
        items: formData.items
      }

      const response = await fetch(`/api/invoices/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      const result = await response.json()
      toast.success('Invoice updated successfully')
      onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!formData) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit {formData.type === 'quote' ? 'Quote' : 'Invoice'}: {formData.invoiceNumber}
            <Badge variant={formData.status === 'paid' ? 'default' : 'secondary'}>
              {formData.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Make changes to the {formData.type === 'quote' ? 'quote' : 'invoice'} details and line items.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">Line Items</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCompany">Company</Label>
                <Input
                  id="customerCompany"
                  value={formData.customerCompany || ''}
                  onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Customer-visible notes..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Textarea
                id="internalNotes"
                value={formData.internalNotes || ''}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                placeholder="Internal notes (not visible to customer)..."
              />
            </div>
          </TabsContent>

          <TabsContent value="items" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Line Items</h3>
              <Button onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Tax %</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="space-y-2">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (21%):</span>
                    <span>{formatCurrency(formData.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(formData.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingAddressLine1">Address Line 1</Label>
                <Input
                  id="billingAddressLine1"
                  value={formData.billingAddressLine1 || ''}
                  onChange={(e) => setFormData({ ...formData, billingAddressLine1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingAddressLine2">Address Line 2</Label>
                <Input
                  id="billingAddressLine2"
                  value={formData.billingAddressLine2 || ''}
                  onChange={(e) => setFormData({ ...formData, billingAddressLine2: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  value={formData.billingCity || ''}
                  onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingPostalCode">Postal Code</Label>
                <Input
                  id="billingPostalCode"
                  value={formData.billingPostalCode || ''}
                  onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingState">State/Province</Label>
                <Input
                  id="billingState"
                  value={formData.billingState || ''}
                  onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingCountry">Country</Label>
                <Input
                  id="billingCountry"
                  value={formData.billingCountry || ''}
                  onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms || ''}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g., 30 days net"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod || ''}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <LoadingButton loading={loading} onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}