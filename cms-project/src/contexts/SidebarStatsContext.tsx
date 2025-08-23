"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useSidebarStats } from '@/hooks/useSidebarStats'

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

interface SidebarStatsContextType {
  stats: SidebarStats | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
}

const SidebarStatsContext = createContext<SidebarStatsContextType | null>(null)

export function SidebarStatsProvider({ children }: { children: ReactNode }) {
  const statsData = useSidebarStats()

  return (
    <SidebarStatsContext.Provider value={statsData}>
      {children}
    </SidebarStatsContext.Provider>
  )
}

export function useSidebarStatsContext() {
  const context = useContext(SidebarStatsContext)
  if (!context) {
    throw new Error('useSidebarStatsContext must be used within a SidebarStatsProvider')
  }
  return context
}