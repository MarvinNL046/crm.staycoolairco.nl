"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingButton } from "@/components/ui/loading-states"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { toast } from "sonner"

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'invoice' | 'quote'
  status: string
  client?: string
  customerName?: string
  customerCompany?: string
  total?: number
  totalAmount?: number
}

interface DeleteInvoiceModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onDelete: (invoiceId: string) => void
}

export function DeleteInvoiceModal({ invoice, open, onClose, onDelete }: DeleteInvoiceModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!invoice) return

    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }

      toast.success(`${invoice.type === 'quote' ? 'Quote' : 'Invoice'} deleted successfully`)
      onDelete(invoice.id)
      onClose()
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error(`Failed to delete ${invoice.type === 'quote' ? 'quote' : 'invoice'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!invoice) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const isDestructiveAction = invoice.status === 'paid' || invoice.status === 'sent'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete {invoice.type === 'quote' ? 'Quote' : 'Invoice'}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the{' '}
            {invoice.type === 'quote' ? 'quote' : 'invoice'} and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Number:</span>
              <span className="font-mono">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Client:</span>
              <span>{invoice.client || invoice.customerCompany || invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount:</span>
              <span className="font-bold">{formatCurrency(invoice.totalAmount || invoice.total || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="capitalize">{invoice.status}</span>
            </div>
          </div>

          {isDestructiveAction && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This {invoice.type === 'quote' ? 'quote' : 'invoice'} has been{' '}
                {invoice.status === 'paid' ? 'paid' : 'sent to the customer'}. 
                Deleting it may cause accounting or legal issues.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              Consider marking the {invoice.type === 'quote' ? 'quote' : 'invoice'} as "Cancelled" 
              instead of deleting it to maintain audit trails.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <LoadingButton 
            loading={loading} 
            onClick={handleDelete}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {invoice.type === 'quote' ? 'Quote' : 'Invoice'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}