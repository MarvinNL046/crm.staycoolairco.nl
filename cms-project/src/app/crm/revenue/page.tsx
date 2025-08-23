"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  Legend,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  DollarSign,
  Users,
  Trophy,
  Zap,
  FileText
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatPercentage, CHART_COLORS } from "@/lib/analytics-helpers"

interface RevenueOverview {
  overview: {
    currentMonth: number
    previousMonth: number
    yearToDate: number
    totalRevenue: number
    averageDealSize: number
    monthOverMonthGrowth: number
    totalDeals: number
  }
  bySource: Array<{
    source: string
    revenue: number
    percentage: number
  }>
  byPerson: Array<{
    person: string
    revenue: number
    deals: number
  }>
  quarterly: Array<{
    quarter: string
    revenue: number
  }>
}

interface MonthlyRevenue {
  monthly: Array<{
    month: string
    revenue: number
    deals: number
    averageDealSize: number
    topSource: string
    threeMonthAvg: number | null
  }>
  summary: {
    totalRevenue: number
    totalDeals: number
    averageMonthlyRevenue: number
    bestMonth: {
      month: string
      revenue: number
    }
    currentMonthTarget: number
    currentMonthActual: number
    targetAchievement: number
  }
}

const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

interface ProfitData {
  revenue: {
    current: number
    previous: number
    ytd: number
    growth: number
  }
  expenses: {
    current: number
    previous: number
    ytd: number
    growth: number
  }
  profit: {
    current: number
    previous: number
    ytd: number
    growth: number
  }
  margins: {
    current: number
    previous: number
    ytd: number
  }
  btw: {
    btw21Collected: number
    btw9Collected: number
    totalCollected: number
    totalDeductible: number
    toPay: number
  } | null
}

export default function RevenuePage() {
  const [overviewData, setOverviewData] = useState<RevenueOverview | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue | null>(null)
  const [profitData, setProfitData] = useState<ProfitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      
      // Fetch overview data
      const overviewResponse = await fetch('/api/revenue/overview')
      if (!overviewResponse.ok) throw new Error('Failed to fetch overview data')
      const overview = await overviewResponse.json()
      
      // Fetch monthly data
      const monthlyResponse = await fetch('/api/revenue/monthly')
      if (!monthlyResponse.ok) throw new Error('Failed to fetch monthly data')
      const monthly = await monthlyResponse.json()
      
      // Fetch profit data
      const profitResponse = await fetch('/api/revenue/profit')
      if (!profitResponse.ok) throw new Error('Failed to fetch profit data')
      const profit = await profitResponse.json()
      
      setOverviewData(overview)
      setMonthlyData(monthly)
      setProfitData(profit)
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Omzet Dashboard</h1>
            <p className="text-muted-foreground">Financiële prestaties en inzichten</p>
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
      </div>
    )
  }

  // Calculate target achievement percentage
  const targetAchievement = monthlyData?.summary.targetAchievement || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Omzet Dashboard</h1>
          <p className="text-muted-foreground">
            Financiële prestaties en revenue analytics
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Laatst bijgewerkt: {lastUpdated.toLocaleTimeString('nl-NL')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRevenueData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards - First Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deze Maand</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overviewData?.overview.currentMonth || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {overviewData?.overview.monthOverMonthGrowth !== undefined && overviewData.overview.monthOverMonthGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={overviewData?.overview.monthOverMonthGrowth !== undefined && overviewData.overview.monthOverMonthGrowth > 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(overviewData?.overview.monthOverMonthGrowth || 0)}
              </span>
              <span className="ml-1">vs vorige maand</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year to Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overviewData?.overview.yearToDate || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {overviewData?.overview.totalDeals || 0} deals gewonnen
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem. Deal Grootte</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overviewData?.overview.averageDealSize || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Per gewonnen deal
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maand Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetAchievement.toFixed(0)}%</div>
            <Progress value={targetAchievement} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {formatCurrency(monthlyData?.summary.currentMonthActual || 0)} / {formatCurrency(monthlyData?.summary.currentMonthTarget || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit & Cost Metrics Cards - Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kosten</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitData?.expenses.current || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {profitData?.expenses.growth !== undefined && profitData.expenses.growth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              )}
              <span className={profitData?.expenses.growth !== undefined && profitData.expenses.growth > 0 ? "text-red-500" : "text-green-500"}>
                {formatPercentage(profitData?.expenses.growth || 0)}
              </span>
              <span className="ml-1">vs vorige maand</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winst</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitData?.profit.current || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {profitData?.profit.growth !== undefined && profitData.profit.growth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={profitData?.profit.growth !== undefined && profitData.profit.growth > 0 ? "text-green-500" : "text-red-500"}>
                {formatPercentage(profitData?.profit.growth || 0)}
              </span>
              <span className="ml-1">vs vorige maand</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Winstmarge</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitData?.margins.current.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              YTD: {profitData?.margins.ytd.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTW Verzameld</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitData?.btw?.totalCollected || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              21%: {formatCurrency(profitData?.btw?.btw21Collected || 0)} | 9%: {formatCurrency(profitData?.btw?.btw9Collected || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BTW te Betalen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(profitData?.btw?.toPay || 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              Aftrekbaar: {formatCurrency(profitData?.btw?.totalDeductible || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Omzet Trend - Laatste 12 Maanden
          </CardTitle>
          <CardDescription>
            Maandelijkse omzet met 3-maands voortschrijdend gemiddelde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyData?.monthly || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
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
                formatter={(value: number, name: string) => {
                  if (name === 'revenue' || name === 'threeMonthAvg') {
                    return [formatCurrency(value), name === 'revenue' ? 'Omzet' : '3-Maands Gem.']
                  }
                  return [value, name]
                }}
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="#0088FE" 
                radius={[4, 4, 0, 0]}
                name="Omzet"
              />
              <Line 
                type="monotone" 
                dataKey="threeMonthAvg" 
                stroke="#FF8042" 
                strokeWidth={2}
                name="3-Maands Gem."
                dot={false}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Distribution */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue by Source */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Omzet per Bron
            </CardTitle>
            <CardDescription>
              Verdeling van omzet over verschillende acquisitie kanalen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overviewData?.bySource || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percentage }) => `${source} ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {overviewData?.bySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {overviewData?.bySource.slice(0, 5).map((source, index) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span>{source.source}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(source.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Omzet per verkoper met aantal deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overviewData?.byPerson.slice(0, 5).map((person, index) => (
                <div key={person.person} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{person.person}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(person.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{person.deals} deals</div>
                    </div>
                  </div>
                  <Progress 
                    value={(person.revenue / (overviewData?.overview.totalRevenue || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Kwartaal Prestaties
          </CardTitle>
          <CardDescription>
            Omzet per kwartaal voor {new Date().getFullYear()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={overviewData?.quarterly || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="quarter" 
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
                fill="#00C49F" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}