"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserCheck, 
  Euro, 
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  formatCurrency, 
  formatPercentage, 
  statusDisplayNames, 
  PIE_COLORS 
} from "@/lib/analytics-helpers"

interface OverviewData {
  totalLeads: { current: number; change: number }
  totalContacts: { current: number; change: number }
  revenue: { current: number; change: number }
  conversionRate: { current: number; change: number }
  leadsByStatus: {
    new: number
    contacted: number
    qualified: number
    proposal: number
    won: number
    lost: number
  }
}

interface TrendsData {
  trends: Array<{
    period: string
    leads: number
    contacts: number
    revenue: number
    conversions: number
  }>
  summary: {
    totalLeads: number
    totalContacts: number
    totalRevenue: number
    totalConversions: number
  }
}


export default function AnalyticsPage() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch overview data
      const overviewResponse = await fetch('/api/analytics/overview')
      if (!overviewResponse.ok) throw new Error('Failed to fetch overview data')
      const overview = await overviewResponse.json()
      
      // Fetch trends data
      const trendsResponse = await fetch('/api/analytics/trends')
      if (!trendsResponse.ok) throw new Error('Failed to fetch trends data')
      const trends = await trendsResponse.json()
      
      setOverviewData(overview)
      setTrendsData(trends)
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])


  // Prepare pie chart data
  const pieChartData = overviewData ? Object.entries(overviewData.leadsByStatus)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: statusDisplayNames[key] || key,
      value,
      color: PIE_COLORS[Object.keys(overviewData.leadsByStatus).indexOf(key)]
    })) : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Inzicht in uw bedrijfsprestaties</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Inzicht in uw bedrijfsprestaties en trends
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Laatst bijgewerkt: {lastUpdated.toLocaleTimeString('nl-NL')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalLeads.current || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overviewData?.totalLeads.change !== undefined && overviewData.totalLeads.change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={overviewData?.totalLeads.change !== undefined && overviewData.totalLeads.change > 0 ? "text-green-500" : "text-red-500"}>
                {overviewData?.totalLeads.change !== undefined ? formatPercentage(overviewData.totalLeads.change) : '0%'}
              </span>
              <span className="ml-1">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Contacten</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.totalContacts.current || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overviewData?.totalContacts.change !== undefined && overviewData.totalContacts.change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={overviewData?.totalContacts.change !== undefined && overviewData.totalContacts.change > 0 ? "text-green-500" : "text-red-500"}>
                {overviewData?.totalContacts.change !== undefined ? formatPercentage(overviewData.totalContacts.change) : '0%'}
              </span>
              <span className="ml-1">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Omzet</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overviewData?.revenue.current || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overviewData?.revenue.change !== undefined && overviewData.revenue.change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={overviewData?.revenue.change !== undefined && overviewData.revenue.change > 0 ? "text-green-500" : "text-red-500"}>
                {overviewData?.revenue.change !== undefined ? formatPercentage(overviewData.revenue.change) : '0%'}
              </span>
              <span className="ml-1">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversieratio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData?.conversionRate.current || 0}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overviewData?.conversionRate.change !== undefined && overviewData.conversionRate.change > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={overviewData?.conversionRate.change !== undefined && overviewData.conversionRate.change > 0 ? "text-green-500" : "text-red-500"}>
                {overviewData?.conversionRate.change !== undefined ? formatPercentage(overviewData.conversionRate.change) : '0%'}
              </span>
              <span className="ml-1">vs vorige periode</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Trends Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trends over Tijd
            </CardTitle>
            <CardDescription>
              Leads, contacten en omzet ontwikkeling afgelopen 12 weken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Leads"
                  dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="contacts" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="Contacten"
                  dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  name="Conversies"
                  dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Lead Status Verdeling
            </CardTitle>
            <CardDescription>
              Huidige verdeling van lead statussen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {pieChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Omzet Ontwikkeling
          </CardTitle>
          <CardDescription>
            Wekelijkse omzet trends gebaseerd op gewonnen leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendsData?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs fill-muted-foreground" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Omzet']}
              />
              <Bar 
                dataKey="revenue" 
                fill="#0088FE" 
                radius={[4, 4, 0, 0]}
                name="Omzet"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}