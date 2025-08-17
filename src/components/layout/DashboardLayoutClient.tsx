'use client'

import { useState, createContext, useContext } from 'react'
import dynamic from 'next/dynamic'
import { User } from '@supabase/supabase-js'

// Dynamically import SidebarNav to ensure theme is available
const SidebarNav = dynamic(() => import('./SidebarNav'), {
  ssr: false,
  loading: () => <div className="w-64 bg-gray-100 dark:bg-gray-900" />
})

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

interface DashboardLayoutClientProps {
  user: User
  tenants: any[]
  children: React.ReactNode
}

export default function DashboardLayoutClient({ user, tenants, children }: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-gray-50">
        <SidebarNav user={user} tenants={tenants} />
        <main className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}