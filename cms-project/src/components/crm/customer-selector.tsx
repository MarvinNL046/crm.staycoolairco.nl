"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { 
  Search,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  Plus,
  Loader2
} from "lucide-react"

const relationshipConfig = {
  hot: { label: "Hot", color: "bg-red-100 text-red-800", icon: "🔥" },
  warm: { label: "Warm", color: "bg-orange-100 text-orange-800", icon: "🟡" },
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800", icon: "❄️" }
}

interface Customer {
  id: number | string
  name: string
  company: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  totalValue?: number
  lastInvoice?: string
  relationship?: 'hot' | 'warm' | 'cold'
  first_name?: string
  last_name?: string
  postal_code?: string
}

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void
  selectedCustomer?: Customer | null
  showRelationshipInfo?: boolean
}

export function CustomerSelector({ onSelect, selectedCustomer, showRelationshipInfo = true }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch customers from API
  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async (search?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/contacts?${params.toString()}`)
      
      if (!response.ok) {
        // For localhost, use mock data if API fails
        if (window.location.hostname === 'localhost') {
          setCustomers(getMockCustomers())
          return
        }
        throw new Error('Failed to fetch customers')
      }
      
      const data = await response.json()
      
      // Transform contacts data to customer format
      const transformedCustomers = (data.contacts || []).map((contact: any) => ({
        id: contact.id,
        name: contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Onbekend',
        company: contact.company || contact.company_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        city: contact.city || '',
        postalCode: contact.postal_code || contact.postalCode || '',
        country: contact.country || 'Nederland',
        totalValue: contact.totalValue || 0,
        lastInvoice: contact.lastInvoice || null,
        relationship: contact.temperature || 'cold',
        first_name: contact.first_name,
        last_name: contact.last_name,
        postal_code: contact.postal_code
      }))
      
      setCustomers(transformedCustomers)
    } catch (err) {
      console.error('Error fetching customers:', err)
      // Fallback to mock data for localhost
      if (window.location.hostname === 'localhost') {
        setCustomers(getMockCustomers())
      } else {
        setError('Kon klanten niet laden')
      }
    } finally {
      setLoading(false)
    }
  }

  // Mock data for localhost fallback
  const getMockCustomers = () => [
    {
      id: 1,
      name: "Jan de Vries",
      company: "De Vries Kantoorpanden BV",
      email: "jan@devrieskantoor.nl",
      phone: "+31 6 12345678",
      address: "Hoofdweg 123",
      city: "Amsterdam",
      postalCode: "1012 AB",
      country: "Nederland",
      totalValue: 45000,
      lastInvoice: "2024-01-15",
      relationship: "hot" as const
    },
    {
      id: 2,
      name: "Maria Jansen",
      company: "Restaurant De Gouden Lepel",
      email: "maria@goudenlepen.nl",
      phone: "+31 6 98765432",
      address: "Marktplein 45",
      city: "Utrecht",
      postalCode: "3511 LM",
      country: "Nederland",
      totalValue: 12000,
      lastInvoice: "2024-02-10",
      relationship: "warm" as const
    },
    {
      id: 3,
      name: "Peter Bakker",
      company: "Bakker Installaties",
      email: "peter@bakkerinstallaties.nl",
      phone: "+31 6 55667788",
      address: "Industrieweg 78",
      city: "Rotterdam",
      postalCode: "3044 AS",
      country: "Nederland",
      totalValue: 78000,
      lastInvoice: "2024-03-01",
      relationship: "hot" as const
    },
    {
      id: 4,
      name: "Sophie van den Berg",
      company: "Van den Berg Hotels",
      email: "sophie@vdberghotels.nl",
      phone: "+31 6 11223344",
      address: "Strandweg 200",
      city: "Den Haag",
      postalCode: "2586 JW",
      country: "Nederland",
      totalValue: 125000,
      lastInvoice: "2024-03-15",
      relationship: "hot" as const
    }
  ]

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue.length > 2) {
        fetchCustomers(searchValue)
      } else if (searchValue.length === 0) {
        fetchCustomers()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchValue.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchValue.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleSelect = (customer: Customer) => {
    onSelect(customer)
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Current Selection Display */}
      {selectedCustomer ? (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{selectedCustomer.name}</span>
                {showRelationshipInfo && selectedCustomer.relationship && (
                  <Badge className={relationshipConfig[selectedCustomer.relationship].color}>
                    {relationshipConfig[selectedCustomer.relationship].icon} {relationshipConfig[selectedCustomer.relationship].label}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                {selectedCustomer.company && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {selectedCustomer.company}
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </div>
                )}
                {(selectedCustomer.address || selectedCustomer.city) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedCustomer.address}{selectedCustomer.address && selectedCustomer.city && ', '}{selectedCustomer.city}
                  </div>
                )}
              </div>
            </div>
            
            {showRelationshipInfo && selectedCustomer.totalValue !== undefined && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Customer Value</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(selectedCustomer.totalValue || 0)}
                </div>
              </div>
            )}
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-3">
                Andere klant selecteren
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Selecteer Klant</DialogTitle>
                <DialogDescription>
                  Kies een bestaande klant of maak een nieuwe aan
                </DialogDescription>
              </DialogHeader>
              
              <Command>
                <CommandInput 
                  placeholder="Zoek klanten..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList className="max-h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-6 text-red-500">
                      {error}
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <CommandEmpty>
                      <div className="text-center py-6">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Geen klanten gevonden</p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nieuwe klant aanmaken
                        </Button>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          onSelect={() => handleSelect(customer)}
                          className="p-4 cursor-pointer"
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{customer.name}</span>
                                {showRelationshipInfo && customer.relationship && (
                                  <Badge className={relationshipConfig[customer.relationship].color}>
                                    {relationshipConfig[customer.relationship].icon}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-0.5">
                                {customer.company && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {customer.company}
                                  </div>
                                )}
                                {customer.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {customer.email}
                                  </div>
                                )}
                                {customer.city && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {customer.city}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {showRelationshipInfo && customer.totalValue !== undefined && (
                              <div className="text-right">
                                <div className="font-medium text-green-600">
                                  {formatCurrency(customer.totalValue || 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Totale waarde
                                </div>
                              </div>
                            )}
                            
                            {selectedCustomer?.id === customer.id && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        /* No Selection - Show Selector */
        <div className="space-y-2">
          <Label>Selecteer Klant</Label>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium">Kies Klant</div>
                    <div className="text-sm text-gray-500">
                      Zoek bestaande klanten of maak een nieuwe aan
                    </div>
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Selecteer Klant</DialogTitle>
                <DialogDescription>
                  Kies een bestaande klant of maak een nieuwe aan
                </DialogDescription>
              </DialogHeader>
              
              <Command>
                <CommandInput 
                  placeholder="Zoek klanten..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList className="max-h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-6 text-red-500">
                      {error}
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <CommandEmpty>
                      <div className="text-center py-6">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Geen klanten gevonden</p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nieuwe klant aanmaken
                        </Button>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          onSelect={() => handleSelect(customer)}
                          className="p-4 cursor-pointer"
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{customer.name}</span>
                                {showRelationshipInfo && customer.relationship && (
                                  <Badge className={relationshipConfig[customer.relationship].color}>
                                    {relationshipConfig[customer.relationship].icon}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-0.5">
                                {customer.company && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {customer.company}
                                  </div>
                                )}
                                {customer.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {customer.email}
                                  </div>
                                )}
                                {customer.city && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {customer.city}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {showRelationshipInfo && customer.totalValue !== undefined && (
                              <div className="text-right">
                                <div className="font-medium text-green-600">
                                  {formatCurrency(customer.totalValue || 0)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Totale waarde
                                </div>
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}