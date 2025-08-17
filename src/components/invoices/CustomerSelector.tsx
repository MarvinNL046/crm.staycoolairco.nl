'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, User, Building, Phone, Mail, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  street?: string
  house_number?: string
  postal_code?: string
  city?: string
  province?: string
  country?: string
  status?: string
  _isLead?: boolean
  _isContact?: boolean
}

interface CustomerSelectorProps {
  value?: { id: string; type: 'lead' | 'contact' } | null
  onChange: (customer: { id: string; type: 'lead' | 'contact' } | null) => void
  placeholder?: string
  required?: boolean
}

export default function CustomerSelector({
  value,
  onChange,
  placeholder = "Zoek klant of lead...",
  required = false
}: CustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<{ leads: Customer[], contacts: Customer[] }>({ leads: [], contacts: [] })
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showConversionDialog, setShowConversionDialog] = useState(false)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [addressData, setAddressData] = useState({
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    province: '',
    country: 'Nederland',
    position: '',
    department: ''
  })
  const [converting, setConverting] = useState(false)
  const { toast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Search customers
  const searchCustomers = async (term: string) => {
    if (!term || term.length < 2) {
      setCustomers({ leads: [], contacts: [] })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/search-customers?q=${encodeURIComponent(term)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error searching customers:', error)
      toast({
        title: "Fout bij zoeken",
        description: "Kon klanten niet zoeken",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      searchCustomers(searchTerm)
    }, 300)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [searchTerm])

  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    
    // If it's a lead, check if address is complete
    if (customer._isLead) {
      const hasCompleteAddress = customer.street && customer.postal_code && customer.city
      if (!hasCompleteAddress) {
        // Pre-fill any existing data
        setAddressData({
          street: customer.street || '',
          house_number: customer.house_number || '',
          postal_code: customer.postal_code || '',
          city: customer.city || '',
          province: customer.province || '',
          country: customer.country || 'Nederland',
          position: '',
          department: ''
        })
        setShowConversionDialog(true)
      } else {
        // Address is complete, ask if they want to convert
        setShowConversionDialog(true)
      }
    } else {
      // It's a contact, select directly
      onChange({ id: customer.id, type: 'contact' })
      setIsOpen(false)
      setSearchTerm(customer.name)
    }
  }

  // Convert lead to contact
  const convertLeadToContact = async () => {
    if (!selectedCustomer || !selectedCustomer._isLead) return

    // Check if address is needed
    const needsAddress = !selectedCustomer.street || !selectedCustomer.postal_code || !selectedCustomer.city
    if (needsAddress && !showAddressDialog) {
      setShowAddressDialog(true)
      return
    }

    setConverting(true)
    try {
      const response = await fetch(`/api/leads/${selectedCustomer.id}/convert-to-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addressData,
          archive_lead: false,
          update_references: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Conversion failed')
      }

      const { contact } = await response.json()
      
      toast({
        title: "Lead geconverteerd",
        description: `${selectedCustomer.name} is nu een contact`,
      })

      // Select the new contact
      onChange({ id: contact.id, type: 'contact' })
      setIsOpen(false)
      setSearchTerm(contact.name)
      setShowConversionDialog(false)
      setShowAddressDialog(false)
    } catch (error: any) {
      toast({
        title: "Conversie mislukt",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setConverting(false)
    }
  }

  // Skip conversion and use lead directly
  const useLeadDirectly = () => {
    if (!selectedCustomer || !selectedCustomer._isLead) return
    onChange({ id: selectedCustomer.id, type: 'lead' })
    setIsOpen(false)
    setSearchTerm(selectedCustomer.name)
    setShowConversionDialog(false)
  }

  return (
    <>
      <div className="relative">
        <div
          className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={searchTerm ? 'text-foreground' : 'text-muted-foreground'}>
            {searchTerm || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Zoek op naam, email of bedrijf..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            {loading && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Zoeken...
              </div>
            )}

            {!loading && searchTerm.length >= 2 && (
              <div className="max-h-[300px] overflow-y-auto">
                {customers.leads.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted">
                      Leads
                    </div>
                    {customers.leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleSelectCustomer(lead)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lead.name}</span>
                              <Badge variant="secondary" className="text-xs">Lead</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {lead.company && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {lead.company}
                                </span>
                              )}
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {lead.email}
                                </span>
                              )}
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                            {(lead.street || lead.city) && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {[lead.street, lead.house_number, lead.postal_code, lead.city]
                                    .filter(Boolean)
                                    .join(' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {customers.contacts.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted">
                      Contacten
                    </div>
                    {customers.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleSelectCustomer(contact)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contact.name}</span>
                              <Badge variant="default" className="text-xs">Contact</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {contact.company && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {contact.company}
                                </span>
                              )}
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                </span>
                              )}
                            </div>
                            {(contact.street || contact.city) && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {[contact.street, contact.house_number, contact.postal_code, contact.city]
                                    .filter(Boolean)
                                    .join(' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {customers.leads.length === 0 && customers.contacts.length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Geen resultaten gevonden
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead to Contact Conversion Dialog */}
      <Dialog open={showConversionDialog && !showAddressDialog} onOpenChange={setShowConversionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead converteren naar contact?</DialogTitle>
            <DialogDescription>
              <strong>{selectedCustomer?.name}</strong> is momenteel een lead. 
              Wilt u deze lead converteren naar een contact voor betere facturatie?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Lead</span>
              <ArrowRight className="w-4 h-4" />
              <User className="w-4 h-4 text-primary" />
              <span className="text-primary">Contact</span>
            </div>
            <p className="mt-3 text-sm">
              Voordelen van conversie:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Volledige klantgegevens inclusief adres</li>
              <li>Betere integratie met facturatie</li>
              <li>Automatische synchronisatie van gegevens</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={useLeadDirectly}>
              Lead gebruiken
            </Button>
            <Button onClick={convertLeadToContact} disabled={converting}>
              {converting ? 'Converteren...' : 'Converteren naar Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Input Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adresgegevens toevoegen</DialogTitle>
            <DialogDescription>
              Vul de ontbrekende adresgegevens in voor {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Label htmlFor="street">Straat</Label>
                <Input
                  id="street"
                  value={addressData.street}
                  onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                  placeholder="Voorbeeldstraat"
                />
              </div>
              <div>
                <Label htmlFor="house_number">Nummer</Label>
                <Input
                  id="house_number"
                  value={addressData.house_number}
                  onChange={(e) => setAddressData({ ...addressData, house_number: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postcode</Label>
                <Input
                  id="postal_code"
                  value={addressData.postal_code}
                  onChange={(e) => setAddressData({ ...addressData, postal_code: e.target.value })}
                  placeholder="1234 AB"
                />
              </div>
              <div>
                <Label htmlFor="city">Plaats</Label>
                <Input
                  id="city"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  placeholder="Amsterdam"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Provincie</Label>
                <Input
                  id="province"
                  value={addressData.province}
                  onChange={(e) => setAddressData({ ...addressData, province: e.target.value })}
                  placeholder="Noord-Holland"
                />
              </div>
              <div>
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                  placeholder="Nederland"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Functie (optioneel)</Label>
                <Input
                  id="position"
                  value={addressData.position}
                  onChange={(e) => setAddressData({ ...addressData, position: e.target.value })}
                  placeholder="Manager"
                />
              </div>
              <div>
                <Label htmlFor="department">Afdeling (optioneel)</Label>
                <Input
                  id="department"
                  value={addressData.department}
                  onChange={(e) => setAddressData({ ...addressData, department: e.target.value })}
                  placeholder="Verkoop"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddressDialog(false)
                setShowConversionDialog(false)
              }}
            >
              Annuleren
            </Button>
            <Button onClick={convertLeadToContact} disabled={converting}>
              {converting ? 'Converteren...' : 'Opslaan en converteren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}