"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ContactForm } from "@/components/contacts/ContactForm"
import { Contact } from "@/types/contacts"
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  FileText,
  UserPlus,
  History,
  Flame,
  Thermometer,
  Snowflake,
  Globe,
  Linkedin,
  Twitter,
  User,
  Clock,
  TrendingUp,
  Euro,
  Tag,
  Plus
} from "lucide-react"

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

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [contactId, setContactId] = useState<string>('')
  const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616'

  useEffect(() => {
    params.then(p => {
      setContactId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (contactId) {
      fetchContact()
    }
  }, [contactId])

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}?tenant_id=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch contact')
      
      const data = await response.json()
      setContact(data.contact)
    } catch (error) {
      console.error('Error fetching contact:', error)
      toast.error('Fout bij ophalen contact')
    } finally {
      setLoading(false)
    }
  }

  const handleContactUpdated = (updatedContact: Contact) => {
    setContact(updatedContact)
    setIsEditDialogOpen(false)
    toast.success('Contact bijgewerkt')
  }

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je dit contact wilt archiveren?')) return
    
    try {
      const response = await fetch(`/api/contacts/${contactId}?tenant_id=${tenantId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete contact')
      
      toast.success('Contact gearchiveerd')
      router.push('/crm/contacts')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Fout bij archiveren contact')
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Contact laden...</p>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Contact niet gevonden</p>
          <Button onClick={() => router.push('/crm/contacts')} className="mt-4">
            Terug naar contacten
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/crm/contacts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{contact.name}</h1>
            <p className="text-muted-foreground">
              {contact.job_title && `${contact.job_title} bij `}
              {contact.company_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Bewerken
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Archiveren
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = `tel:${contact.phone}`}
          disabled={!contact.phone}
        >
          <Phone className="mr-2 h-4 w-4" />
          Bellen
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.href = `mailto:${contact.email}`}
          disabled={!contact.email}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email sturen
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/invoicing/new?customer_id=${contact.id}`)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Factuur maken
        </Button>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2">
        <Badge className={relationshipConfig[contact.relationship_status]?.color || ''}>
          {relationshipConfig[contact.relationship_status]?.label || contact.relationship_status}
        </Badge>
        {contact.temperature && (
          <Badge className={temperatureConfig[contact.temperature]?.color || ''}>
            <span className="flex items-center gap-1">
              {temperatureConfig[contact.temperature]?.icon}
              {temperatureConfig[contact.temperature]?.label}
            </span>
          </Badge>
        )}
        {contact.status !== 'active' && (
          <Badge variant="secondary">{contact.status}</Badge>
        )}
        {contact.tags && contact.tags.map((tag, index) => (
          <Badge key={index} variant="outline">
            <Tag className="mr-1 h-3 w-3" />
            {tag}
          </Badge>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contact Informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Basis Informatie</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{contact.name}</span>
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline">
                        {contact.mobile} (mobiel)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Bedrijf</h3>
                <div className="space-y-2">
                  {contact.company_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.company_name}</span>
                    </div>
                  )}
                  {contact.job_title && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.job_title}</span>
                    </div>
                  )}
                  {contact.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.department}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(contact.address_line1 || contact.city) && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Adres</h3>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {contact.address_line1 && <div>{contact.address_line1}</div>}
                      {contact.address_line2 && <div>{contact.address_line2}</div>}
                      {(contact.postal_code || contact.city) && (
                        <div>{contact.postal_code} {contact.city}</div>
                      )}
                      {contact.country && <div>{contact.country}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(contact.website || contact.linkedin_url || contact.twitter_handle) && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Social Media</h3>
                  <div className="space-y-2">
                    {contact.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {contact.website}
                        </a>
                      </div>
                    )}
                    {contact.linkedin_url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      </div>
                    )}
                    {contact.twitter_handle && (
                      <div className="flex items-center gap-2 text-sm">
                        <Twitter className="h-4 w-4 text-muted-foreground" />
                        <a href={`https://twitter.com/${contact.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          @{contact.twitter_handle}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {contact.notes && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold">Notities</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Communication Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communicatie Voorkeuren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.preferred_contact_method && (
                <div>
                  <p className="text-sm font-medium">Voorkeur contact methode</p>
                  <p className="text-sm text-muted-foreground capitalize">{contact.preferred_contact_method}</p>
                </div>
              )}
              {(contact.do_not_call || contact.do_not_email) && (
                <div className="space-y-2">
                  {contact.do_not_call && (
                    <Badge variant="destructive">Niet bellen</Badge>
                  )}
                  {contact.do_not_email && (
                    <Badge variant="destructive">Geen email</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Source */}
          {(contact.source || contact.lead_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Herkomst</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.source && (
                  <div>
                    <p className="text-sm font-medium">Bron</p>
                    <p className="text-sm text-muted-foreground">{contact.source}</p>
                  </div>
                )}
                {contact.converted_from_lead_at && (
                  <div>
                    <p className="text-sm font-medium">Geconverteerd van lead</p>
                    <p className="text-sm text-muted-foreground">{formatDate(contact.converted_from_lead_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Aangemaakt</p>
                <p className="text-sm text-muted-foreground">{formatDate(contact.created_at)}</p>
              </div>
              {contact.updated_at && contact.updated_at !== contact.created_at && (
                <div>
                  <p className="text-sm font-medium">Laatst bijgewerkt</p>
                  <p className="text-sm text-muted-foreground">{formatDate(contact.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity/History Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Activiteit & Historie</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="activity">Activiteit</TabsTrigger>
              <TabsTrigger value="appointments">Afspraken</TabsTrigger>
              <TabsTrigger value="invoices">Facturen</TabsTrigger>
              <TabsTrigger value="history">Historie</TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Activiteit tracking komt binnenkort beschikbaar</p>
              </div>
            </TabsContent>
            
            <TabsContent value="appointments" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Afspraken integratie komt binnenkort beschikbaar</p>
              </div>
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Facturen integratie komt binnenkort beschikbaar</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push(`/invoicing/new?customer_id=${contact.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe factuur maken
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Wijzigingshistorie komt binnenkort beschikbaar</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van het contact aan
            </DialogDescription>
          </DialogHeader>
          <ContactForm 
            contact={contact} 
            onSuccess={handleContactUpdated} 
            onCancel={() => setIsEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}