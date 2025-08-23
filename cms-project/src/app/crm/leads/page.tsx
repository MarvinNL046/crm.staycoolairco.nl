"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  MapPin,
  List,
  Columns3
} from "lucide-react"
import { KanbanBoard } from "@/components/crm/kanban-board"
import { toast } from "sonner"

// Mock data removed - now using real data from Supabase

const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500", 
  qualified: "bg-green-500",
  proposal: "bg-purple-500",
  won: "bg-emerald-500",
  lost: "bg-red-500"
}

const statusVariants = {
  new: "default" as const,
  contacted: "secondary" as const,
  qualified: "default" as const, 
  proposal: "secondary" as const,
  won: "default" as const,
  lost: "destructive" as const
}

const statusTranslations = {
  new: "Nieuw",
  contacted: "Gecontacteerd",
  qualified: "Geen Gehoor",
  proposal: "Offerte",
  won: "Gewonnen",
  lost: "Verloren"
}

export default function LeadsPage() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLead, setEditingLead] = useState<any>(null)

  // Fetch leads from Supabase
  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      // For now, using the same tenant_id as invoices
      const response = await fetch('/api/leads?tenant_id=80496bff-b559-4b80-9102-3a84afdaa616')
      if (!response.ok) throw new Error('Kon leads niet ophalen')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (leadId: number | string, newStatus: string) => {
    // Check if lead is moving to "geen gehoor" (qualified) and has exceeded retry limit
    const lead = leads.find(l => l.id === leadId)
    if (newStatus === 'qualified' && lead && (lead.retry_count || 0) >= 3) {
      // Automatically move to lost
      newStatus = 'lost'
      toast.warning('Lead automatisch naar Lost verplaatst (max pogingen bereikt)')
    }

    // Optimistic update - update UI immediately
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: newStatus }
          : lead
      )
    )

    // Update in database
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Kon lead status niet bijwerken')
      }

      const result = await response.json()
      console.log('Lead status updated:', result.message)
      toast.success(`Lead verplaatst naar ${newStatus}`)
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('Kon lead status niet bijwerken')
      // Revert on error
      fetchLeads()
    }
  }

  const handleRetryLead = async (leadId: number | string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    const currentRetryCount = lead.retry_count || 0
    const newRetryCount = currentRetryCount + 1

    // Optimistic update
    setLeads(prevLeads => 
      prevLeads.map(l => 
        l.id === leadId 
          ? { ...l, status: 'new', retry_count: newRetryCount }
          : l
      )
    )

    try {
      // Update lead status back to 'new' and increment retry count
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'new',
          retry_count: newRetryCount,
          notes: `${lead.notes || ''}\n[${new Date().toLocaleDateString('nl-NL')}] Poging ${newRetryCount} - Geen gehoor, opnieuw proberen`
        }),
      })

      if (!response.ok) {
        throw new Error('Kon lead niet opnieuw proberen')
      }

      toast.success(`Lead terug naar Nieuwe Lead (poging ${newRetryCount}/3)`)
    } catch (error) {
      console.error('Error retrying lead:', error)
      toast.error('Kon lead niet opnieuw proberen')
      fetchLeads()
    }
  }

  const handleEditLead = (lead: any) => {
    setEditingLead(lead)
  }

  const handleSaveEdit = async () => {
    if (!editingLead) return

    try {
      const response = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingLead.name,
          email: editingLead.email,
          phone: editingLead.phone,
          company: editingLead.company,
          city: editingLead.city,
          source: editingLead.source,
          notes: editingLead.notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Kon lead niet bijwerken')
      }

      toast.success('Lead bijgewerkt')
      setEditingLead(null)
      fetchLeads()
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Kon lead niet bijwerken')
    }
  }

  const handleArchiveLead = async (leadId: number | string) => {
    // Optimistic update - remove from UI immediately
    setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId))

    try {
      // Archive the lead in database (set archived = true)
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          archived: true,
          archived_at: new Date().toISOString(),
          notes: `${leads.find(l => l.id === leadId)?.notes || ''}\n[${new Date().toLocaleDateString('nl-NL')}] Lead gearchiveerd na 3 pogingen geen gehoor`
        }),
      })

      if (!response.ok) {
        throw new Error('Kon lead niet archiveren')
      }

      toast.success('Lead verwijderd uit lijst (gearchiveerd)')
    } catch (error) {
      console.error('Error archiving lead:', error)
      toast.error('Kon lead niet archiveren')
      fetchLeads()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Beheer en volg je verkoopkansen
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <Columns3 className="h-4 w-4 mr-1" />
              Pipeline
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              Lijst
            </Button>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              Actieve leads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nieuwe Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(lead => lead.status === 'new').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Te contacteren
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geen Gehoor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(lead => lead.status === 'qualified').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {leads.filter(lead => lead.status === 'qualified' && (lead.retry_count || 0) >= 3).length} op max pogingen
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gewonnen Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(lead => lead.status === 'won').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Conversie: {leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'won').length / leads.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search - only show in list view */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Zoek leads..." 
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filteren
          </Button>
        </div>
      )}

      {/* Content based on view mode */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Leads laden...</p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* Leads Table */
        <Card>
          <CardHeader>
            <CardTitle>Lead Lijst</CardTitle>
            <CardDescription>
              Recente leads en hun huidige status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Bron</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waarde</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.company || lead.name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {lead.city || lead.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.source || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[lead.status as keyof typeof statusVariants]}>
                        {statusTranslations[lead.status as keyof typeof statusTranslations] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      €{lead.value ? lead.value.toLocaleString('nl-NL') : '0'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('nl-NL') : '-'}
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Bekijk Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Bewerk Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            Bel Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Stuur Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Verwijder Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Kanban Pipeline View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Verkoop Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Sleep leads tussen fases om hun status bij te werken
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filteren
              </Button>
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Zoeken
              </Button>
            </div>
          </div>
          
          <KanbanBoard 
            leads={leads} 
            onStatusChange={handleStatusChange} 
            onRetryLead={handleRetryLead}
            onArchiveLead={handleArchiveLead}
            onEditLead={handleEditLead}
          />
        </div>
      )}

      {/* Edit Lead Dialog */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lead Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van deze lead
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={editingLead.name || ''}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Bedrijf</Label>
                <Input
                  id="company"
                  value={editingLead.company || ''}
                  onChange={(e) => setEditingLead({...editingLead, company: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefoon</Label>
                <Input
                  id="phone"
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Stad</Label>
                <Input
                  id="city"
                  value={editingLead.city || ''}
                  onChange={(e) => setEditingLead({...editingLead, city: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source">Bron</Label>
                <Input
                  id="source"
                  value={editingLead.source || ''}
                  onChange={(e) => setEditingLead({...editingLead, source: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({...editingLead, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLead(null)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveEdit}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}