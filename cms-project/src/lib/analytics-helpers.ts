// Analytics helper functions for data processing and formatting

export interface AnalyticsMetric {
  current: number
  change: number
}

export interface LeadsByStatus {
  new: number
  contacted: number
  qualified: number
  proposal: number
  won: number
  lost: number
}

export interface TrendDataPoint {
  period: string
  leads: number
  contacts: number
  revenue: number
  conversions: number
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Function to get week key for grouping data
export const getWeekKey = (date: Date): string => {
  const year = date.getFullYear()
  const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7)
  return `${year}-${week.toString().padStart(2, '0')}`
}

// Function to convert week key to readable format
export const formatWeekPeriod = (weekKey: string): string => {
  const [year, weekNum] = weekKey.split('-')
  const weekStart = new Date(parseInt(year), 0, 1 + (parseInt(weekNum) - 1) * 7)
  const monthName = weekStart.toLocaleString('nl-NL', { month: 'short' })
  const day = weekStart.getDate()
  return `${day} ${monthName}`
}

// Status display names in Dutch
export const statusDisplayNames: Record<string, string> = {
  new: 'Nieuw',
  contacted: 'Gecontacteerd',
  qualified: 'Gekwalificeerd',
  proposal: 'Offerte',
  won: 'Gewonnen',
  lost: 'Verloren'
}

// Chart colors
export const CHART_COLORS = {
  primary: '#0088FE',
  secondary: '#00C49F',
  tertiary: '#FFBB28',
  quaternary: '#FF8042',
  quinary: '#8884d8',
  senary: '#82ca9d'
}

export const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']