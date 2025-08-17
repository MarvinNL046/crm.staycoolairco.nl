'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { useSidebar } from './DashboardLayoutClient'
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Zap, 
  Settings, 
  LogOut, 
  Search, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCircle,
  FileText,
  BarChart3,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Megaphone,
  Target,
  Package,
  Palette,
  Database,
  Key,
  Bell
} from 'lucide-react'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface SidebarNavProps {
  user: User
  tenants: any[]
}

export default function SidebarNav({ user, tenants }: SidebarNavProps) {
  const { collapsed, setCollapsed } = useSidebar()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { isSuperAdmin } = useSuperAdmin()

  // Voor nu gebruiken we de eerste tenant
  const currentTenant = tenants[0]?.tenants

  const navigation = [
    {
      name: 'Dashboard',
      items: [
        { name: 'Overzicht', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Kanban Pipeline', href: '/dashboard/pipeline', icon: BarChart3 },
        { name: 'Analytics', href: '/dashboard/analytics', icon: Target },
      ]
    },
    {
      name: 'CRM',
      items: [
        { name: 'Leads', href: '/dashboard/leads', icon: Users },
        { name: 'Klanten', href: '/dashboard/customers', icon: Building2 },
        { name: 'Contacten', href: '/dashboard/contacts', icon: UserCircle },
        { name: 'Deals', href: '/dashboard/deals', icon: CreditCard },
      ]
    },
    {
      name: 'Communicatie',
      items: [
        { name: 'E-mail', href: '/dashboard/email', icon: Mail },
        { name: 'SMS/WhatsApp', href: '/dashboard/messages', icon: MessageSquare },
        { name: 'Telefoon', href: '/dashboard/phone', icon: Phone },
        { name: 'Campagnes', href: '/dashboard/campaigns', icon: Megaphone },
      ]
    },
    {
      name: 'Planning',
      items: [
        { name: 'Kalender', href: '/dashboard/calendar', icon: Calendar },
        { name: 'Taken', href: '/dashboard/tasks', icon: FileText },
        { name: 'Afspraken', href: '/dashboard/appointments', icon: Calendar },
      ]
    },
    {
      name: 'Automatisering',
      items: [
        { name: 'Workflows', href: '/dashboard/automations', icon: Zap },
        { name: 'Triggers', href: '/dashboard/triggers', icon: Bell },
        { name: 'Templates', href: '/dashboard/templates', icon: FileText },
      ]
    },
    {
      name: 'Configuratie',
      items: [
        { name: 'Instellingen', href: '/dashboard/settings', icon: Settings },
        { name: 'Team', href: '/dashboard/team', icon: Users },
        { name: 'Integraties', href: '/dashboard/integrations', icon: Package },
        { name: 'API Keys', href: '/dashboard/apikeys', icon: Key },
        { name: 'Branding', href: '/dashboard/branding', icon: Palette },
        { name: 'Database', href: '/dashboard/database', icon: Database },
      ]
    },
    ...(isSuperAdmin ? [{
      name: 'Super Admin',
      items: [
        { name: 'Beheer', href: '/super-admin', icon: Shield },
      ]
    }] : [])
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo and collapse button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          {!collapsed && (
            <Link href="/dashboard" className="text-xl font-bold text-white">
              StayCool CRM
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((section) => (
            <div key={section.name} className="mb-6">
              {!collapsed && (
                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {section.name}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                      {!collapsed && item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-800 p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center text-sm focus:outline-none focus:ring-2 focus:ring-white"
            >
              <div className={`h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white ${
                collapsed ? '' : 'mr-3'
              }`}>
                {user.email?.[0].toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email}
                  </p>
                  {currentTenant && (
                    <p className="text-xs text-gray-400 truncate">
                      {currentTenant.name}
                    </p>
                  )}
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className={`absolute bottom-full mb-2 ${
                collapsed ? 'left-0' : 'right-0'
              } w-48 rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5`}>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Uitloggen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  )
}