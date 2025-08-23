"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingButton } from "@/components/ui/loading-states"
import { Send, X, Mail } from "lucide-react"
import { toast } from "sonner"

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'invoice' | 'quote'
  customerName: string
  customerEmail: string
}

interface EmailInvoiceModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
  onSent: () => void
}

export function EmailInvoiceModal({ invoice, open, onClose, onSent }: EmailInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  })

  // Initialize email data when invoice changes
  useEffect(() => {
    if (invoice) {
      const typeLabel = invoice.type === 'quote' ? 'Offerte' : 'Factuur'
      const defaultSubject = `${typeLabel} ${invoice.invoiceNumber} - StayCool Airconditioning`
      const defaultMessage = `Beste ${invoice.customerName},

Hierbij ontvangt u de ${invoice.type === 'quote' ? 'offerte' : 'factuur'} ${invoice.invoiceNumber} van StayCool Airconditioning.

${invoice.type === 'quote' 
  ? 'Deze offerte is geldig voor 30 dagen.'
  : 'De betalingstermijn voor deze factuur is 30 dagen netto.'
}

Heeft u vragen over deze ${invoice.type === 'quote' ? 'offerte' : 'factuur'}? Neem dan gerust contact met ons op.

Met vriendelijke groet,

StayCool Airconditioning
Tel: +31 20 123 4567
Email: info@staycoolairco.nl
Web: www.staycoolairco.nl`

      setEmailData({
        to: invoice.customerEmail || '',
        subject: defaultSubject,
        message: defaultMessage
      })
    }
  }, [invoice])

  const handleSend = async () => {
    if (!invoice) return

    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const result = await response.json()
      toast.success(result.message || 'Email verzonden!')
      onSent()
      onClose()
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(`Fout bij verzenden: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            {invoice.type === 'quote' ? 'Offerte' : 'Factuur'} Verzenden
          </DialogTitle>
          <DialogDescription>
            Verstuur {invoice.type === 'quote' ? 'offerte' : 'factuur'} {invoice.invoiceNumber} naar {invoice.customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Naar</Label>
            <Input
              id="to"
              type="email"
              placeholder="klant@email.com"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              placeholder="Factuur onderwerp..."
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Bericht</Label>
            <Textarea
              id="message"
              placeholder="Persoonlijk bericht..."
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              rows={12}
              className="resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <Mail className="h-4 w-4" />
              Bijlage
            </div>
            <p className="text-sm text-blue-700">
              PDF van {invoice.type === 'quote' ? 'offerte' : 'factuur'} {invoice.invoiceNumber} wordt automatisch toegevoegd
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Annuleren
          </Button>
          <LoadingButton 
            loading={loading} 
            onClick={handleSend}
            disabled={!emailData.to || !emailData.subject}
          >
            <Send className="h-4 w-4 mr-2" />
            Versturen
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}