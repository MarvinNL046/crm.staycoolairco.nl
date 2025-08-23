"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  Plus, 
  Send, 
  Calendar,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Copy,
  PenSquare
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { CampaignModal } from "@/components/campaigns/CampaignModal"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  type: string
  segment_type: string
  recipient_count: number
  sent_at: string | null
  scheduled_at: string | null
  created_at: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  open_rate: number
  click_rate: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    scheduled: 0,
    sent: 0,
    sending: 0
  })

  useEffect(() => {
    fetchCampaigns()
  }, [statusFilter])

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616',
        status: statusFilter
      })

      const response = await fetch(`/api/campaigns?${params}`)
      const data = await response.json()

      if (data.campaigns) {
        setCampaigns(data.campaigns)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze campagne wilt verwijderen?')) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616',
          name: `${campaign.name} (kopie)`,
          subject: campaign.subject,
          from_name: 'StayCool Airco',
          from_email: 'info@staycoolairco.nl',
          type: campaign.type,
          segment_type: campaign.segment_type
        })
      })

      if (response.ok) {
        fetchCampaigns()
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-900/20">Concept</Badge>
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">Gepland</Badge>
      case 'sending':
        return <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">Bezig...</Badge>
      case 'sent':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">Verzonden</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Campaigns laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Beheer en verstuur email campagnes naar je klanten
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Campagne
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal Campagnes
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Alle campagnes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concepten
            </CardTitle>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/20">
              <PenSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Nog niet verzonden
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gepland
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">
              Wachten op verzending
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verzonden
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">
              Succesvol verzonden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek campagnes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Status: {statusFilter === 'all' ? 'Alle' : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    Alle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                    Concept
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('scheduled')}>
                    Gepland
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('sent')}>
                    Verzonden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Geen campagnes gevonden</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Probeer een andere zoekterm' : 'Maak je eerste email campagne'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Campagne
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-muted-foreground mb-3">{campaign.subject}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{campaign.recipient_count} ontvangers</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {campaign.status === 'scheduled' && campaign.scheduled_at
                                ? `Gepland: ${formatDate(campaign.scheduled_at)}`
                                : campaign.status === 'sent' && campaign.sent_at
                                ? `Verzonden: ${formatDate(campaign.sent_at)}`
                                : `Aangemaakt: ${formatDate(campaign.created_at)}`
                              }
                            </span>
                          </div>
                          {campaign.segment_type && (
                            <Badge variant="secondary" className="text-xs">
                              {campaign.segment_type === 'all' ? 'Iedereen' : 
                               campaign.segment_type === 'leads' ? 'Leads' :
                               campaign.segment_type === 'customers' ? 'Klanten' : 
                               campaign.segment_type}
                            </Badge>
                          )}
                        </div>

                        {/* Stats voor verzonden campagnes */}
                        {campaign.status === 'sent' && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Verzonden</p>
                                <p className="font-medium">{campaign.sent_count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Geopend</p>
                                <p className="font-medium">{campaign.open_rate}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Geklikt</p>
                                <p className="font-medium">{campaign.click_rate}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Afgeleverd</p>
                                <p className="font-medium">
                                  {campaign.delivered_count > 0 
                                    ? Math.round((campaign.delivered_count / campaign.sent_count) * 100)
                                    : 0}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/crm/campaigns/${campaign.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Bekijken
                      </DropdownMenuItem>
                      {campaign.status === 'draft' && (
                        <DropdownMenuItem onClick={() => router.push(`/crm/campaigns/${campaign.id}/edit`)}>
                          <PenSquare className="mr-2 h-4 w-4" />
                          Bewerken
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Dupliceren
                      </DropdownMenuItem>
                      {campaign.status === 'draft' && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(campaign.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Verwijderen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      <CampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchCampaigns()
        }}
      />
    </div>
  )
}