"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Contact, CreateContactDTO, UpdateContactDTO } from "@/types/contacts"

interface ContactFormProps {
  contact?: Contact
  leadId?: string
  onSuccess?: (contact: Contact) => void
  onCancel?: () => void
}

export function ContactForm({ contact, leadId, onSuccess, onCancel }: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateContactDTO | UpdateContactDTO>({
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    mobile: contact?.mobile || "",
    company_name: contact?.company_name || "",
    job_title: contact?.job_title || "",
    relationship_status: contact?.relationship_status || "prospect",
    temperature: contact?.temperature || undefined,
    address_line1: contact?.address_line1 || "",
    address_line2: contact?.address_line2 || "",
    city: contact?.city || "",
    postal_code: contact?.postal_code || "",
    country: contact?.country || "Nederland",
    preferred_contact_method: contact?.preferred_contact_method || "email",
    notes: contact?.notes || "",
    lead_id: leadId,
    ...(contact && {
      status: contact.status,
      do_not_call: contact.do_not_call,
      do_not_email: contact.do_not_email,
    })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error("Naam is verplicht")
      return
    }
    
    setLoading(true)
    
    try {
      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts"
      const method = contact ? "PUT" : "POST"
      
      const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616'
      const dataToSend = { 
        ...formData,
        tenant_id: tenantId
      }
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })
      
      if (!response.ok) {
        throw new Error("Failed to save contact")
      }
      
      const data = await response.json()
      toast.success(contact ? "Contact bijgewerkt" : "Contact aangemaakt")
      onSuccess?.(data.contact)
    } catch (error) {
      console.error("Error saving contact:", error)
      toast.error("Fout bij opslaan contact")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">Basis informatie</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Volledige naam"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@voorbeeld.nl"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Telefoon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+31 20 123 4567"
            />
          </div>
          
          <div>
            <Label htmlFor="mobile">Mobiel</Label>
            <Input
              id="mobile"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="+31 6 1234 5678"
            />
          </div>
        </div>
      </div>
      
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="font-semibold">Bedrijf</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Bedrijfsnaam</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Bedrijf B.V."
            />
          </div>
          
          <div>
            <Label htmlFor="job_title">Functie</Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="Directeur"
            />
          </div>
        </div>
      </div>
      
      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-semibold">Adres</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="address_line1">Straat en huisnummer</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              placeholder="Hoofdstraat 123"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">Postcode</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="1234 AB"
              />
            </div>
            
            <div>
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Amsterdam"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Relationship Status */}
      <div className="space-y-4">
        <h3 className="font-semibold">Relatie</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="relationship_status">Status</Label>
            <Select
              value={formData.relationship_status}
              onValueChange={(value: any) => setFormData({ ...formData, relationship_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="customer">Klant</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="vendor">Leverancier</SelectItem>
                <SelectItem value="other">Overig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="temperature">Temperatuur</Label>
            <Select
              value={formData.temperature || ""}
              onValueChange={(value: any) => setFormData({ ...formData, temperature: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">🔥 Hot</SelectItem>
                <SelectItem value="warm">🌡️ Warm</SelectItem>
                <SelectItem value="cold">❄️ Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Communication Preferences */}
      {contact && (
        <div className="space-y-4">
          <h3 className="font-semibold">Communicatie voorkeuren</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="do_not_call">Niet bellen</Label>
              <Switch
                id="do_not_call"
                checked={(formData as UpdateContactDTO).do_not_call || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, do_not_call: checked } as UpdateContactDTO)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="do_not_email">Geen email</Label>
              <Switch
                id="do_not_email"
                checked={(formData as UpdateContactDTO).do_not_email || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, do_not_email: checked } as UpdateContactDTO)
                }
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notities</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Interne notities..."
          rows={4}
        />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuleren
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Opslaan..." : contact ? "Bijwerken" : "Aanmaken"}
        </Button>
      </div>
    </form>
  )
}