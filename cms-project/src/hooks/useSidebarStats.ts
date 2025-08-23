"use client"

import { useEffect, useState } from 'react'

interface BadgeData {
  count: number
  variant: 'default' | 'secondary' | 'destructive'
}

interface SidebarStats {
  leads: {
    total: number
    new: number
    badge: BadgeData | null
  }
  contacts: {
    total: number
    badge: BadgeData | null
  }
  deals: {
    total: number
    won: number
    badge: BadgeData | null
  }
  quotes: {
    total: number
    pending: number
    badge: BadgeData | null
  }
  invoices: {
    total: number
    urgent: number
    badge: BadgeData | null
  }
  companies: {
    total: number
    badge: BadgeData | null
  }
}

export function useSidebarStats() {
  const [stats, setStats] = useState<SidebarStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/sidebar/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch sidebar stats')
      }
      
      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
      
    } catch (err) {
      console.error('Error fetching sidebar stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Manual refresh function
  const refresh = () => {
    fetchStats()
  }

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh
  }
}