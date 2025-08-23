"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Eye,
  Edit,
  FileText,
  Building2,
  MapPin,
  User,
  TrendingUp,
  Euro,
  Calendar,
  History,
  UserPlus,
  Flame,
  Thermometer,
  Snowflake
} from "lucide-react"
import { ContactForm } from "@/components/contacts/ContactForm"
import { Contact } from "@/types/contacts"

// API URLs
const API_URL = '/api/contacts'
const temperatureConfig = {
  hot: { label: "Hot", color: "bg-red-100 text-red-800", icon: <Flame className="h-4 w-4" /> },
  warm: { label: "Warm", color: "bg-orange-100 text-orange-800", icon: <Thermometer className="h-4 w-4" /> },
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800", icon: <Snowflake className="h-4 w-4" /> }
}

const relationshipConfig = {
  prospect: { label: "Prospect", color: "bg-gray-100 text-gray-800" },
  lead: { label: "Lead", color: "bg-blue-100 text-blue-800" },
  customer: { label: "Klant", color: "bg-green-100 text-green-800" },
  partner: { label: "Partner", color: "bg-purple-100 text-purple-800" },
  vendor: { label: "Leverancier", color: "bg-yellow-100 text-yellow-800" },
  other: { label: "Overig", color: "bg-gray-100 text-gray-800" }
}

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRelationship, setFilterRelationship] = useState("all")
  const [filterTemperature, setFilterTemperature] = useState("all")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  
  // Fetch contacts from API
  useEffect(() => {
    fetchContacts()
  }, [filterStatus, filterRelationship, filterTemperature])
  
  const fetchContacts = async () => {
    try {
      const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616'
      const params = new URLSearchParams()
      
      params.append("tenant_id", tenantId)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterRelationship !== "all") params.append("relationship_status", filterRelationship)
      if (filterTemperature !== "all") params.append("temperature", filterTemperature)
      if (searchTerm) params.append("search", searchTerm)
      
      const response = await fetch(`${API_URL}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      
      const data = await response.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast.error('Fout bij ophalen contacten')
    } finally {
      setLoading(false)
    }
  }
  
  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  const handleContactCreated = (contact: Contact) => {
    setContacts([contact, ...contacts])
    setIsCreateDialogOpen(false)
    toast.success('Contact aangemaakt')
  }
  
  const handleContactUpdated = (updatedContact: Contact) => {
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c))
    setIsEditDialogOpen(false)
    setEditingContact(null)
    toast.success('Contact bijgewerkt')
  }
  
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Weet je zeker dat je dit contact wilt archiveren?')) return
    
    try {
      const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616'
      const response = await fetch(`${API_URL}/${contactId}?tenant_id=${tenantId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete contact')
      
      setContacts(contacts.filter(c => c.id !== contactId))
      toast.success('Contact gearchiveerd')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Fout bij archiveren contact')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('nl-NL').format(new Date(dateString))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacten</h1>
          <p className="text-muted-foreground">
            Beheer je klantrelaties en contactgeschiedenis
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuw Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nieuw Contact Aanmaken</DialogTitle>
              <DialogDescription>
                Vul de gegevens in voor het nieuwe contact
              </DialogDescription>
            </DialogHeader>
            <ContactForm onSuccess={handleContactCreated} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Contacten</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              Actieve contacten
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klanten</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.relationship_status === 'customer').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Actieve klanten
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Prospects</CardTitle>
            <Flame className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {contacts.filter(c => c.temperature === 'hot').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoge prioriteit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter(c => c.relationship_status === 'lead').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Potentiële klanten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Zoek contacten..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={filterRelationship} onValueChange={setFilterRelationship}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Relaties</SelectItem>
            <SelectItem value="prospect">Prospects</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="customer">Klanten</SelectItem>
            <SelectItem value="partner">Partners</SelectItem>
            <SelectItem value="vendor">Leveranciers</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterTemperature} onValueChange={setFilterTemperature}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Temperaturen</SelectItem>
            <SelectItem value="hot">🔥 Hot</SelectItem>
            <SelectItem value="warm">🌡️ Warm</SelectItem>
            <SelectItem value="cold">❄️ Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contactenlijst</CardTitle>
          <CardDescription>
            Al je contacten met relatiestatus en contactinformatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Laden...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen contacten gevonden. Maak je eerste contact aan!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Relatie</TableHead>
                  <TableHead>Temperatuur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <a 
                            href={`/crm/contacts/${contact.id}`}
                            className="font-medium hover:text-primary hover:underline cursor-pointer"
                          >
                            {contact.name}
                          </a>
                          {contact.job_title && (
                            <div className="text-sm text-muted-foreground">{contact.job_title}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.company_name && (
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {contact.company_name}
                          </div>
                          {contact.city && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {contact.city}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={relationshipConfig[contact.relationship_status]?.color || ''}>
                        {relationshipConfig[contact.relationship_status]?.label || contact.relationship_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.temperature && (
                        <div className="flex items-center gap-1">
                          {temperatureConfig[contact.temperature]?.icon}
                          <span>{temperatureConfig[contact.temperature]?.label}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(contact.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acties</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/crm/contacts/${contact.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Bekijken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingContact(contact)
                            setIsEditDialogOpen(true)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `tel:${contact.phone}`} disabled={!contact.phone}>
                            <Phone className="mr-2 h-4 w-4" />
                            Bellen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${contact.email}`} disabled={!contact.email}>
                            <Mail className="mr-2 h-4 w-4" />
                            Email sturen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push(`/invoicing/new?customer_id=${contact.id}`)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Factuur maken
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            Archiveren
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van het contact aan
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <ContactForm 
              contact={editingContact} 
              onSuccess={handleContactUpdated} 
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingContact(null)
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}