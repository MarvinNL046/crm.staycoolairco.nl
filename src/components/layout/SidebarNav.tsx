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
import { SimpleThemeToggle } from '@/components/theme/ThemeToggle'

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
        { name: 'Facturatie', href: '/invoicing', icon: FileText },
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
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
           style={{ 
             backgroundColor: 'var(--background-sidebar)',
             borderRight: '1px solid var(--border-primary)' 
           }}>
        {/* Logo and collapse button */}
        <div className="flex h-16 items-center justify-between px-4" 
             style={{ borderBottom: '1px solid var(--border-primary)' }}>
          {!collapsed && (
            <Link href="/dashboard" className="text-xl font-bold hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--text-inverse)' }}>
              StayCool CRM
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 hover:bg-opacity-20 hover:bg-white"
            style={{ 
              color: 'var(--text-secondary)',
              '--tw-ring-color': 'var(--border-focus)'
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-inverse)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
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
                <h3 className="px-4 text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-tertiary)' }}>
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
                      className="flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md mx-2 focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: isActive ? 'var(--interactive-primary)' : 'transparent',
                        color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        '--tw-ring-color': 'var(--border-focus)'
                      } as React.CSSProperties}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--interactive-secondary-hover)';
                          e.currentTarget.style.color = 'var(--text-inverse)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
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
        <div className="p-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center text-sm focus:outline-none focus:ring-2 rounded-md p-2 transition-all duration-200 hover:bg-opacity-20 hover:bg-white"
              style={{ '--tw-ring-color': 'var(--border-focus)' } as React.CSSProperties}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-medium ${
                collapsed ? '' : 'mr-3'
              }`}
                   style={{
                     backgroundColor: 'var(--interactive-primary)',
                     color: 'var(--text-inverse)'
                   }}>
                {user.email?.[0].toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate"
                     style={{ color: 'var(--text-inverse)' }}>
                    {user.email}
                  </p>
                  {currentTenant && (
                    <p className="text-xs truncate"
                       style={{ color: 'var(--text-tertiary)' }}>
                      {currentTenant.name}
                    </p>
                  )}
                </div>
              )}
              
              {/* Theme Toggle */}
              {!collapsed && (
                <div className="ml-2">
                  <SimpleThemeToggle />
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className={`absolute bottom-full mb-2 ${
                collapsed ? 'left-0' : 'right-0'
              } w-48 rounded-md py-1 shadow-lg ring-1 ring-opacity-20`}
                   style={{
                     backgroundColor: 'var(--background-elevated)',
                     borderColor: 'var(--border-primary)',
                     boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                   }}>
                {collapsed && (
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                    <SimpleThemeToggle />
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-all duration-200 hover:bg-opacity-20 hover:bg-red-500"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--interactive-danger)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
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
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  )
}