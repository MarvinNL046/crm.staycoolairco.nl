"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface CampaignModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CampaignModal({ open, onClose, onSuccess }: CampaignModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    preview_text: "",
    from_name: "StayCool Airco",
    from_email: "info@staycoolairco.nl",
    segment_type: "all"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616',
          ...formData,
          type: 'email'
        })
      })

      if (response.ok) {
        const data = await response.json()
        onSuccess()
        // Redirect to campaign editor
        router.push(`/crm/campaigns/${data.campaign.id}/edit`)
      } else {
        console.error('Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nieuwe Email Campagne</DialogTitle>
            <DialogDescription>
              Maak een nieuwe email campagne. Je kunt de inhoud later toevoegen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campagne Naam</Label>
              <Input
                id="name"
                placeholder="bijv. Zomer Actie 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Onderwerp</Label>
              <Input
                id="subject"
                placeholder="bijv. 20% korting op alle airco's"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview">Preview Tekst</Label>
              <Textarea
                id="preview"
                placeholder="Deze tekst wordt getoond in de inbox preview..."
                value={formData.preview_text}
                onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_name">Afzender Naam</Label>
                <Input
                  id="from_name"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_email">Afzender Email</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Ontvangers</Label>
              <Select
                value={formData.segment_type}
                onValueChange={(value) => setFormData({ ...formData, segment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle contacten</SelectItem>
                  <SelectItem value="leads">Alleen leads</SelectItem>
                  <SelectItem value="customers">Alleen klanten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Aanmaken..." : "Campagne Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}