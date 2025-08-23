"use client"

import { useState } from "react"
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
  Plus
} from "lucide-react"

// Mock customer data (same as contacts)
const mockCustomers = [
  {
    id: 1,
    name: "Jan Janssen",
    company: "Bakkerij Janssen",
    email: "jan@bakkerijjanssen.nl",
    phone: "+31 6 1234 5678",
    address: "Hoofdstraat 123",
    city: "Amsterdam",
    postalCode: "1234 AB",
    country: "Netherlands",
    totalValue: 15750,
    lastInvoice: "2024-01-20",
    relationship: "hot" as const
  },
  {
    id: 2,
    name: "Maria de Groot",
    company: "Restaurant Groen",
    email: "maria@restaurantgroen.nl",
    phone: "+31 6 2345 6789",
    address: "Kerkstraat 45",
    city: "Utrecht", 
    postalCode: "3511 AB",
    country: "Netherlands",
    totalValue: 28500,
    lastInvoice: "2024-01-15",
    relationship: "warm" as const
  },
  {
    id: 3,
    name: "Peter van Dam",
    company: "Hotel Zonneschijn",
    email: "peter@hotelzonneschijn.nl",
    phone: "+31 6 3456 7890",
    address: "Stationsplein 1",
    city: "Rotterdam",
    postalCode: "3013 AB", 
    country: "Netherlands",
    totalValue: 48250,
    lastInvoice: "2024-01-05",
    relationship: "cold" as const
  },
  {
    id: 4,
    name: "Lisa Smit",
    company: "Café de Hoek",
    email: "lisa@cafedehoek.nl",
    phone: "+31 6 4567 8901",
    address: "Marktplein 8",
    city: "Den Haag",
    postalCode: "2511 AB",
    country: "Netherlands",
    totalValue: 8500,
    lastInvoice: "2024-01-22",
    relationship: "warm" as const
  }
]

const relationshipConfig = {
  hot: { label: "Hot", color: "bg-red-100 text-red-800", icon: "🔥" },
  warm: { label: "Warm", color: "bg-orange-100 text-orange-800", icon: "🟡" },
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800", icon: "❄️" }
}

interface Customer {
  id: number
  name: string
  company: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  totalValue: number
  lastInvoice: string
  relationship: 'hot' | 'warm' | 'cold'
}

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void
  selectedCustomer?: Customer | null
  showRelationshipInfo?: boolean // New prop to control what info to show
}

export function CustomerSelector({ onSelect, selectedCustomer, showRelationshipInfo = true }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchValue.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchValue.toLowerCase())
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
                {showRelationshipInfo && (
                  <Badge className={relationshipConfig[selectedCustomer.relationship].color}>
                    {relationshipConfig[selectedCustomer.relationship].icon} {relationshipConfig[selectedCustomer.relationship].label}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {selectedCustomer.company}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {selectedCustomer.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedCustomer.phone}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedCustomer.address}, {selectedCustomer.city}
                </div>
              </div>
            </div>
            
            {showRelationshipInfo && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Customer Value</div>
                <div className="font-semibold text-green-600">
                  {formatCurrency(selectedCustomer.totalValue)}
                </div>
              </div>
            )}
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-3">
                Change Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Customer</DialogTitle>
                <DialogDescription>
                  Choose an existing customer or create a new one
                </DialogDescription>
              </DialogHeader>
              
              <Command>
                <CommandInput 
                  placeholder="Search customers..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No customers found</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Customer
                      </Button>
                    </div>
                  </CommandEmpty>
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
                              {showRelationshipInfo && (
                                <Badge className={relationshipConfig[customer.relationship].color}>
                                  {relationshipConfig[customer.relationship].icon}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {customer.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {customer.city}
                              </div>
                            </div>
                          </div>
                          
                          {showRelationshipInfo && (
                            <div className="text-right">
                              <div className="font-medium text-green-600">
                                {formatCurrency(customer.totalValue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total value
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
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        /* No Selection - Show Selector */
        <div className="space-y-2">
          <Label>Select Customer</Label>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium">Choose Customer</div>
                    <div className="text-sm text-gray-500">
                      Search existing customers or create new
                    </div>
                  </div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Customer</DialogTitle>
                <DialogDescription>
                  Choose an existing customer or create a new one
                </DialogDescription>
              </DialogHeader>
              
              <Command>
                <CommandInput 
                  placeholder="Search customers..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No customers found</p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Customer
                      </Button>
                    </div>
                  </CommandEmpty>
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
                              {showRelationshipInfo && (
                                <Badge className={relationshipConfig[customer.relationship].color}>
                                  {relationshipConfig[customer.relationship].icon}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {customer.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {customer.city}
                              </div>
                            </div>
                          </div>
                          
                          {showRelationshipInfo && (
                            <div className="text-right">
                              <div className="font-medium text-green-600">
                                {formatCurrency(customer.totalValue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total value
                              </div>
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}