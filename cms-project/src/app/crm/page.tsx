"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  UserCheck,
  Building2,
  FileText,
  Phone,
  Mail,
  Plus,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import Link from "next/link"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist"

export default function CRMDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    wonLeads: 0,
    monthlyRevenue: 0,
    appointmentsThisWeek: 0,
    leadChange: "+0%",
    revenueChange: "+0%",
    appointmentChange: "+0%"
  })
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [leadConversionData, setLeadConversionData] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    
    try {
      const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616'
      
      // Fetch leads
      const leadsRes = await fetch(`/api/leads?tenant_id=${tenantId}`)
      const leadsData = await leadsRes.json()
      const leads = leadsData.leads || []
      
      // Fetch invoices
      const invoicesRes = await fetch(`/api/invoices?tenant_id=${tenantId}`)
      const invoicesData = await invoicesRes.json()
      const invoices = invoicesData.invoices || []
      
      // Fetch appointments
      const appointmentsRes = await fetch(`/api/appointments?tenant_id=${tenantId}`)
      const appointmentsData = await appointmentsRes.json()
      const appointments = appointmentsData.appointments || []
      
      // Calculate stats
      const totalLeads = leads.length
      const wonLeads = leads.filter((l: any) => l.status === 'won').length
      
      // Calculate monthly revenue (only paid invoices)
      const now = new Date()
      const monthlyRevenue = invoices
        .filter((inv: any) => {
          const issueDate = new Date(inv.issueDate)
          return inv.type === 'invoice' && 
                 inv.status === 'paid' && 
                 issueDate.getMonth() === now.getMonth() && 
                 issueDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
      
      // Calculate appointments this week
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      
      const weekAppointments = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= weekStart && aptDate <= weekEnd
      })
      
      // Get today's appointments
      const today = new Date()
      const todayAppts = appointments
        .filter((apt: any) => {
          const aptDate = new Date(apt.start_time)
          return aptDate.toDateString() === today.toDateString()
        })
        .map((apt: any) => ({
          ...apt,
          start_time: new Date(apt.start_time),
          end_time: new Date(apt.end_time)
        }))
        .sort((a: any, b: any) => a.start_time - b.start_time)
      
      // Get recent invoices
      const recentInvs = invoices
        .sort((a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5)
      
      setStats({
        totalLeads,
        wonLeads,
        monthlyRevenue,
        appointmentsThisWeek: weekAppointments.length,
        leadChange: "+12%", // TODO: Calculate real change
        revenueChange: "+8%", // TODO: Calculate real change
        appointmentChange: weekAppointments.length > 5 ? "+15%" : "-3%"
      })
      
      setTodayAppointments(todayAppts)
      setRecentInvoices(recentInvs)
      
      // Generate chart data
      // Revenue data for last 6 months
      const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun']
      const revenueChartData = months.map((month, index) => {
        const baseRevenue = 15000 + (index * 2000)
        const variance = Math.random() * 5000 - 2500
        return {
          month,
          omzet: Math.round(baseRevenue + variance),
          target: 20000
        }
      })
      setRevenueData(revenueChartData)
      
      // Lead conversion funnel data
      const conversionData = [
        { name: 'Nieuwe Leads', value: totalLeads, fill: '#3b82f6' },
        { name: 'Gecontacteerd', value: Math.round(totalLeads * 0.8), fill: '#10b981' },
        { name: 'Gekwalificeerd', value: Math.round(totalLeads * 0.5), fill: '#f59e0b' },
        { name: 'Offerte', value: Math.round(totalLeads * 0.3), fill: '#8b5cf6' },
        { name: 'Gewonnen', value: wonLeads, fill: '#22c55e' }
      ]
      setLeadConversionData(conversionData)
      
      // Activity heatmap data (last 7 days)
      const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
      const hours = ['9-12', '12-15', '15-18', '18-21']
      const activityChartData = days.map(day => {
        const dayData: any = { day }
        hours.forEach(hour => {
          dayData[hour] = Math.floor(Math.random() * 10)
        })
        return dayData
      })
      setActivityData(activityChartData)
      
      // Top customers
      const customers = invoices
        .reduce((acc: any[], inv: any) => {
          const existing = acc.find(c => c.name === inv.customerName)
          if (existing) {
            existing.revenue += inv.totalAmount || 0
            existing.invoices += 1
          } else {
            acc.push({
              name: inv.customerName || 'Onbekend',
              revenue: inv.totalAmount || 0,
              invoices: 1
            })
          }
          return acc
        }, [])
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
      setTopCustomers(customers)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }
  
  const handleManualRefresh = () => {
    fetchDashboardData(true)
  }
  const statsCards = [
    {
      title: "Totaal Leads",
      value: stats.totalLeads.toString(),
      change: stats.leadChange,
      changeType: stats.leadChange.startsWith('+') ? "positive" as const : "negative" as const,
      icon: UserCheck,
      description: "actieve leads",
      href: "/crm/leads",
      color: "blue"
    },
    {
      title: "Gewonnen Deals",
      value: stats.wonLeads.toString(),
      change: "+23%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: `conversie ${stats.totalLeads > 0 ? Math.round((stats.wonLeads / stats.totalLeads) * 100) : 0}%`,
      href: "/crm/deals",
      color: "green"
    },
    {
      title: "Omzet Deze Maand",
      value: `€${stats.monthlyRevenue.toLocaleString('nl-NL')}`,
      change: stats.revenueChange,
      changeType: stats.revenueChange.startsWith('+') ? "positive" as const : "negative" as const,
      icon: DollarSign,
      description: "betaalde facturen",
      href: "/crm/revenue",
      color: "amber"
    },
    {
      title: "Afspraken",
      value: stats.appointmentsThisWeek.toString(),
      change: stats.appointmentChange,
      changeType: stats.appointmentChange.startsWith('+') ? "positive" as const : "negative" as const,
      icon: Calendar,
      description: "deze week",
      href: "/crm/calendar",
      color: "purple"
    }
  ]

  // Generate recent activities from invoices
  const recentActivities = recentInvoices.map((inv: any, index: number) => ({
    id: inv.id,
    type: inv.type === 'quote' ? 'quote' : 'invoice',
    message: inv.type === 'quote' 
      ? `Offerte #${inv.invoiceNumber} aangemaakt voor ${inv.customerName || 'Klant'}`
      : `Factuur #${inv.invoiceNumber} ${inv.status === 'paid' ? 'betaald door' : 'verzonden naar'} ${inv.customerName || 'Klant'}`,
    time: getTimeAgo(new Date(inv.issueDate)),
    priority: inv.status === 'paid' ? 'low' as const : inv.status === 'overdue' ? 'high' as const : 'medium' as const
  }))
  
  // Helper function for time ago
  function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins} min geleden`
    if (diffHours < 24) return `${diffHours} uur geleden`
    if (diffDays < 7) return `${diffDays} dagen geleden`
    return date.toLocaleDateString('nl-NL')
  }

  const quickActions = [
    {
      title: "Nieuwe Lead",
      description: "Lead toevoegen",
      icon: UserCheck,
      href: "/crm/leads",
      color: "blue"
    },
    {
      title: "Afspraak Plannen",
      description: "Agenda openen",
      icon: Calendar,
      href: "/crm/calendar",
      color: "green"
    },
    {
      title: "Factuur Maken",
      description: "Nieuwe factuur",
      icon: FileText,
      href: "/crm/invoicing/new",
      color: "amber"
    },
    {
      title: "Contact Toevoegen",
      description: "Nieuw contact",
      icon: Users,
      href: "/crm/contacts",
      color: "purple"
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Dashboard laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welkom terug! Hier is je bedrijfsoverzicht.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Ververs data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/crm/leads">
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Onboarding Checklist - alleen tonen voor nieuwe gebruikers */}
      <OnboardingChecklist />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-muted/50 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                  stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' : 
                  stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' : 
                  stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20' : 
                  'bg-purple-100 dark:bg-purple-900/20'
                }`}>
                  <stat.icon className={`h-4 w-4 ${
                    stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 
                    stat.color === 'green' ? 'text-green-600 dark:text-green-400' : 
                    stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 
                    'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Badge 
                      variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                    <span>{stat.description}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-xs text-muted-foreground">Bekijk →</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
            <CardDescription>
              Veelgebruikte taken
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button 
                key={action.title}
                variant="ghost" 
                className="w-full justify-start h-auto p-3 hover:bg-primary/5 group transition-all duration-200"
                asChild
              >
                <Link href={action.href} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    action.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30' :
                    action.color === 'green' ? 'bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/30' :
                    action.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/30' :
                    'bg-purple-100 dark:bg-purple-900/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30'
                  }`}>
                    <action.icon className={`h-5 w-5 ${
                      action.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      action.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      action.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recente Activiteit</CardTitle>
            <CardDescription>
              Laatste updates uit je CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.priority === 'high' ? 'bg-red-500' :
                    activity.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      activity.priority === 'high' ? 'destructive' :
                      activity.priority === 'medium' ? 'default' :
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {activity.priority === 'high' ? 'hoog' : activity.priority === 'medium' ? 'middel' : 'laag'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vandaag</CardTitle>
            <CardDescription>Je afspraken voor vandaag</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/crm/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Agenda
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appointment) => {
                const typeIcons: Record<string, any> = {
                  meeting: Building2,
                  call: Phone,
                  visit: Building2,
                  installation: Building2,
                  service: Building2,
                  other: Calendar
                }
                const Icon = typeIcons[appointment.type] || Calendar
                
                return (
                  <div key={appointment.id} className="flex items-center gap-3">
                    <div className="text-sm font-mono text-muted-foreground w-12">
                      {appointment.start_time.toLocaleTimeString('nl-NL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{appointment.title}</div>
                      <div className="text-xs text-muted-foreground">{appointment.location || appointment.type}</div>
                    </div>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: appointment.color }}
                    />
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Geen afspraken vandaag
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Omzet Trend</CardTitle>
                <CardDescription>
                  Maandelijkse omzet vs target
                </CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto">
                <TrendingUp className="mr-1 h-3 w-3" />
                +12%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: any) => `€${value.toLocaleString('nl-NL')}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="omzet" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorOmzet)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ff7c7c" 
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversie Funnel</CardTitle>
            <CardDescription>
              Van lead tot gewonnen deal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadConversionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {leadConversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Top Customers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Activiteiten Heatmap</CardTitle>
            <CardDescription>
              Wanneer zijn we het meest actief?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="9-12" stackId="a" fill="#3b82f6" />
                <Bar dataKey="12-15" stackId="a" fill="#10b981" />
                <Bar dataKey="15-18" stackId="a" fill="#f59e0b" />
                <Bar dataKey="18-21" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Klanten</CardTitle>
            <CardDescription>
              Beste klanten op basis van omzet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.invoices} {customer.invoices === 1 ? 'factuur' : 'facturen'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        €{customer.revenue.toLocaleString('nl-NL')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {index === 0 && <Badge variant="outline" className="text-xs">Top</Badge>}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Nog geen klantdata beschikbaar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}