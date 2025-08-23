"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingButton } from "@/components/ui/loading-states"
import { ArrowRight, FileText, CheckCircle, X, Receipt } from "lucide-react"
import { toast } from "sonner"

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'invoice' | 'quote'
  status: string
  client: string
  contact: string
  total: number
}

interface ConvertQuoteModalProps {
  quote: Invoice | null
  open: boolean
  onClose: () => void
  onConverted: (invoiceId: string, invoiceNumber: string) => void
}

export function ConvertQuoteModal({ quote, open, onClose, onConverted }: ConvertQuoteModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    if (!quote) return

    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${quote.id}/convert`, {
        method: 'POST',
      })

      if (!response.ok) {
        let errorMessage = 'Failed to convert quote'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error('Failed to parse error response:', e)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      toast.success(result.message || 'Quote converted successfully!')
      onConverted(result.invoiceId, result.invoiceNumber)
      onClose()
    } catch (error) {
      console.error('Error converting quote:', error)
      toast.error(`Failed to convert quote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!quote || quote.type !== 'quote') return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const canConvert = ['draft', 'sent', 'viewed'].includes(quote.status)
  const alreadyConverted = ['converted', 'cancelled', 'paid', 'accepted'].includes(quote.status)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <Receipt className="h-5 w-5 text-blue-500" />
            Offerte Omzetten naar Factuur
          </DialogTitle>
          <DialogDescription>
            Zet deze offerte om naar een factuur voor facturatie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quote Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium text-lg">{quote.invoiceNumber}</div>
                <div className="text-sm text-gray-600">{quote.client}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{formatCurrency(quote.total)}</div>
                <div className="text-sm text-gray-600 capitalize">{quote.status}</div>
              </div>
            </div>
          </div>

          {/* Conversion Process */}
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Offerte</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="flex items-center gap-2 text-green-600">
                <Receipt className="h-5 w-5" />
                <span className="font-medium">Factuur</span>
              </div>
            </div>
          </div>

          {/* Conversion Details */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>• Een nieuwe factuur wordt aangemaakt met een uniek factuurnummer</div>
                <div>• Alle regelitems en klantgegevens worden overgenomen</div>
                <div>• De vervaldatum wordt automatisch ingesteld (30 dagen)</div>
                <div>• De offerte status wordt gewijzigd naar "Geconverteerd"</div>
              </div>
            </AlertDescription>
          </Alert>

          {alreadyConverted && (
            <Alert>
              <AlertDescription>
                <strong>Info:</strong> Deze offerte is al {['paid', 'accepted'].includes(quote.status) ? 'geaccepteerd en ' : ''}omgezet naar een factuur. 
                {quote.status === 'accepted' && 'Status "Accepted" betekent dat de offerte is geaccepteerd en '}
                {quote.status === 'paid' && 'Status "Paid" betekent dat de offerte is geaccepteerd en '}
                {!['paid', 'accepted'].includes(quote.status) && `Status "${quote.status}" betekent dat `}er al een factuur van deze offerte is gemaakt.
              </AlertDescription>
            </Alert>
          )}

          {!canConvert && !alreadyConverted && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Let op:</strong> Deze offerte kan niet worden omgezet omdat de status "{quote.status}" is. 
                Alleen offertes met status "Draft", "Sent" of "Viewed" kunnen worden omgezet.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Annuleren
          </Button>
          <LoadingButton 
            loading={loading} 
            onClick={handleConvert}
            disabled={!canConvert}
            className="bg-green-600 hover:bg-green-700"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Omzetten naar Factuur
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}