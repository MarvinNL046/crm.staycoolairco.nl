export interface InvoiceItem {
  id?: string
  name?: string
  description: string
  quantity: number
  unitPrice: number
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  discountAmount?: number
  discountPercentage?: number
  total: number
  position?: number
  productId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  title?: string
  type: 'invoice' | 'quote'
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'converted' | 'accepted'
  client?: string
  contact?: string
  email?: string
  total?: number
  subtotal: number
  taxAmount: number
  currency: string
  issueDate: string
  dueDate?: string
  paidDate?: string
  quoteValidUntil?: string
  items: InvoiceItem[]
  notes?: string
  paymentTerms?: string
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
  taxRate: number
  discountAmount?: number
  discountPercentage?: number
  totalAmount: number
  internalNotes?: string
  paymentMethod?: string
}