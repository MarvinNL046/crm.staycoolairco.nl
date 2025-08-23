"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Zap,
  Plus,
  Play,
  Pause,
  Settings,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Workflow {
  id: string
  name: string
  description: string
  category: string
  status: string
  trigger_type: string
  trigger_count: number
  success_count: number
  failure_count: number
  last_triggered_at: string | null
  created_at: string
}

export default function AutomationsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    // Voor nu gebruik ik mock data
    const mockWorkflows: Workflow[] = [
      {
        id: '1',
        name: 'Welkom nieuwe lead',
        description: 'Stuur automatisch een welkomst email en maak een follow-up taak',
        category: 'lead',
        status: 'active',
        trigger_type: 'lead_created',
        trigger_count: 156,
        success_count: 154,
        failure_count: 2,
        last_triggered_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 30).toISOString()
      },
      {
        id: '2',
        name: 'Lead nurturing serie',
        description: 'Automatische email serie voor lead nurturing',
        category: 'lead',
        status: 'active',
        trigger_type: 'lead_status_changed',
        trigger_count: 89,
        success_count: 87,
        failure_count: 2,
        last_triggered_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: '3',
        name: 'Afspraak herinnering',
        description: 'Stuur SMS herinnering 1 dag voor afspraak',
        category: 'appointment',
        status: 'active',
        trigger_type: 'appointment_scheduled',
        trigger_count: 234,
        success_count: 232,
        failure_count: 2,
        last_triggered_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 45).toISOString()
      },
      {
        id: '4',
        name: 'Win-back campagne',
        description: 'Heractiveer inactieve klanten',
        category: 'customer',
        status: 'inactive',
        trigger_type: 'manual',
        trigger_count: 12,
        success_count: 12,
        failure_count: 0,
        last_triggered_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 60).toISOString()
      }
    ]

    setWorkflows(mockWorkflows)
    setLoading(false)
  }

  const handleToggleStatus = async (workflow: Workflow) => {
    // Toggle workflow status
    const newStatus = workflow.status === 'active' ? 'inactive' : 'active'
    setWorkflows(workflows.map(w => 
      w.id === workflow.id ? { ...w, status: newStatus } : w
    ))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze automation wilt verwijderen?')) {
      return
    }
    setWorkflows(workflows.filter(w => w.id !== id))
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      lead_created: 'Lead aangemaakt',
      lead_status_changed: 'Lead status veranderd',
      appointment_scheduled: 'Afspraak gepland',
      form_submitted: 'Formulier ingediend',
      manual: 'Handmatig'
    }
    return labels[trigger] || trigger
  }

  const getSuccessRate = (workflow: Workflow) => {
    if (workflow.trigger_count === 0) return 0
    return Math.round((workflow.success_count / workflow.trigger_count) * 100)
  }

  const formatTimeAgo = (date: string | null) => {
    if (!date) return 'Nooit'
    
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes} min geleden`
    if (hours < 24) return `${hours} uur geleden`
    return `${days} dagen geleden`
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Automations laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">
            Automatiseer je werkprocessen met slimme workflows
          </p>
        </div>
        <Button onClick={() => router.push('/crm/workflows')}>
          <Plus className="mr-2 h-4 w-4" />
          Nieuwe Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actieve Workflows
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Van {workflows.length} totaal
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uitgevoerd Vandaag
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.trigger_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Totaal uitgevoerd
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">
              Gemiddeld succes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tijd Bespaard
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156u</div>
            <p className="text-xs text-muted-foreground">
              Deze maand
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Geen workflows gevonden</h3>
              <p className="text-muted-foreground mb-4">
                Maak je eerste automation workflow
              </p>
              <Button onClick={() => router.push('/crm/workflows')}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        workflow.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-gray-100 dark:bg-gray-900/20'
                      }`}>
                        <Zap className={`h-6 w-6 ${
                          workflow.status === 'active'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{workflow.name}</h3>
                          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                            {workflow.status === 'active' ? 'Actief' : 'Inactief'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{workflow.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <span>Trigger: {getTriggerLabel(workflow.trigger_type)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span>{workflow.trigger_count} keer uitgevoerd</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Laatst: {formatTimeAgo(workflow.last_triggered_at)}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-4 flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">Success rate:</div>
                            <div className="font-medium">{getSuccessRate(workflow)}%</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>{workflow.success_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>{workflow.failure_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(workflow)}
                    >
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pauzeer
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Activeer
                        </>
                      )}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/crm/workflows/${workflow.id}`)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Dupliceren
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(workflow.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}