"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft,
  Mail,
  Users,
  Eye,
  MousePointer,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react"

interface Campaign {
  id: string
  name: string
  subject: string
  preview_text: string
  from_name: string
  from_email: string
  content_html: string
  content_text: string
  type: string
  status: string
  segment_type: string
  recipient_count: number
  sent_at: string | null
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  unsubscribed_count: number
  complained_count: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaign()
  }, [id])

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`)
      const data = await response.json()
      
      if (data.campaign) {
        setCampaign(data.campaign)
      }
    } catch (error) {
      console.error('Error fetching campaign:', error)
    } finally {
      setLoading(false)
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Campaign laden...</p>
        </div>
      </div>
    )
  }

  const deliveryRate = campaign.sent_count > 0 
    ? ((campaign.delivered_count / campaign.sent_count) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/crm/campaigns')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(campaign.status)}
              <span className="text-sm text-muted-foreground">
                {campaign.segment_type === 'all' ? 'Alle contacten' : 
                 campaign.segment_type === 'leads' ? 'Leads' :
                 campaign.segment_type === 'customers' ? 'Klanten' : 
                 campaign.segment_type}
              </span>
            </div>
          </div>
        </div>
        {campaign.status === 'draft' && (
          <Button onClick={() => router.push(`/crm/campaigns/${campaign.id}/edit`)}>
            Bewerken
          </Button>
        )}
      </div>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Algemene informatie over deze campagne</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Onderwerp</p>
                <p className="font-medium">{campaign.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Van</p>
                <p className="font-medium">{campaign.from_name} &lt;{campaign.from_email}&gt;</p>
              </div>
            </div>
            {campaign.preview_text && (
              <div>
                <p className="text-sm text-muted-foreground">Preview tekst</p>
                <p className="font-medium">{campaign.preview_text}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Aangemaakt</p>
                <p className="font-medium">{formatDate(campaign.created_at)}</p>
              </div>
              {campaign.scheduled_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Gepland voor</p>
                  <p className="font-medium">{formatDate(campaign.scheduled_at)}</p>
                </div>
              )}
              {campaign.sent_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Verzonden op</p>
                  <p className="font-medium">{formatDate(campaign.sent_at)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats for sent campaigns */}
      {campaign.status === 'sent' && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Verzonden
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.sent_count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  emails verzonden
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Geopend
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.open_rate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {campaign.opened_count} opens
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Geklikt
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <MousePointer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.click_rate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {campaign.clicked_count} clicks
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Afgeleverd
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveryRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {campaign.delivered_count} afgeleverd
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Prestaties</CardTitle>
              <CardDescription>Overzicht van de email prestaties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Aflevering</span>
                    </div>
                    <span className="text-sm font-medium">{deliveryRate}%</span>
                  </div>
                  <Progress value={parseFloat(deliveryRate)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Open Rate</span>
                    </div>
                    <span className="text-sm font-medium">{campaign.open_rate}%</span>
                  </div>
                  <Progress value={campaign.open_rate} className="h-2 bg-green-100 dark:bg-green-900/20">
                    <div className="h-full bg-green-600 dark:bg-green-400 rounded-full transition-all" style={{ width: `${campaign.open_rate}%` }} />
                  </Progress>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Click Rate</span>
                    </div>
                    <span className="text-sm font-medium">{campaign.click_rate}%</span>
                  </div>
                  <Progress value={campaign.click_rate} className="h-2 bg-purple-100 dark:bg-purple-900/20">
                    <div className="h-full bg-purple-600 dark:bg-purple-400 rounded-full transition-all" style={{ width: `${campaign.click_rate}%` }} />
                  </Progress>
                </div>

                {campaign.bounce_rate > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Bounce Rate</span>
                      </div>
                      <span className="text-sm font-medium">{campaign.bounce_rate}%</span>
                    </div>
                    <Progress value={campaign.bounce_rate} className="h-2 bg-red-100 dark:bg-red-900/20">
                      <div className="h-full bg-red-600 dark:bg-red-400 rounded-full transition-all" style={{ width: `${campaign.bounce_rate}%` }} />
                    </Progress>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Engagement Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bounced</span>
                    <span className="font-medium">{campaign.bounced_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uitgeschreven</span>
                    <span className="font-medium">{campaign.unsubscribed_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Klachten</span>
                    <span className="font-medium">{campaign.complained_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tijdlijn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Verzonden</p>
                      <p className="text-xs text-muted-foreground">{formatDate(campaign.sent_at)}</p>
                    </div>
                  </div>
                  {campaign.completed_at && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Voltooid</p>
                        <p className="text-xs text-muted-foreground">{formatDate(campaign.completed_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vergelijking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Industrie gem.</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">21.3%</span>
                      {campaign.open_rate > 21.3 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Jouw gem.</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">58.2%</span>
                      {campaign.open_rate > 58.2 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
          <CardDescription>De inhoud van deze campagne</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-medium">{campaign.from_name}</div>
                <div className="text-sm text-muted-foreground">&lt;{campaign.from_email}&gt;</div>
              </div>
              <div className="font-medium">{campaign.subject}</div>
              {campaign.preview_text && (
                <div className="text-sm text-muted-foreground mt-1">
                  {campaign.preview_text}
                </div>
              )}
            </div>
            <div className="p-4 bg-background">
              {campaign.content_html ? (
                <div dangerouslySetInnerHTML={{ __html: campaign.content_html }} />
              ) : campaign.content_text ? (
                <pre className="whitespace-pre-wrap font-sans">{campaign.content_text}</pre>
              ) : (
                <p className="text-muted-foreground">Geen inhoud beschikbaar</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}