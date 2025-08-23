'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  Users,
  BarChart3,
  Settings,
  Shield,
  Activity,
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  CreditCard,
} from 'lucide-react'

const navigationItems = [
  {
    name: 'Overzicht',
    href: '/super-admin',
    icon: Home,
  },
  {
    name: 'Tenants',
    href: '/super-admin/tenants',
    icon: Building2,
  },
  {
    name: 'Gebruikers',
    href: '/super-admin/users',
    icon: Users,
  },
  {
    name: 'Abonnementen',
    href: '/super-admin/subscriptions',
    icon: CreditCard,
  },
  {
    name: 'Analytics',
    href: '/super-admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Systeem Status',
    href: '/super-admin/system',
    icon: Activity,
  },
  {
    name: 'Database',
    href: '/super-admin/database',
    icon: Database,
  },
  {
    name: 'Instellingen',
    href: '/super-admin/settings',
    icon: Settings,
  },
]

interface SuperAdminSidebarProps {
  user: {
    id: string
    email?: string
    full_name?: string
  }
}

export function SuperAdminSidebar({ user }: SuperAdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <span className="font-bold text-gray-900">Super Admin</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'flex-shrink-0 h-5 w-5',
                  isActive ? 'text-red-600' : 'text-gray-500',
                  isCollapsed ? 'mr-0' : 'mr-3'
                )}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">
              {user.full_name || 'Super Admin'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        
        <Link
          href="/auth/signout"
          className={cn(
            'flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100',
            isCollapsed ? 'justify-center' : ''
          )}
          title={isCollapsed ? 'Uitloggen' : undefined}
        >
          <LogOut className={cn('h-5 w-5', isCollapsed ? 'mr-0' : 'mr-3')} />
          {!isCollapsed && <span>Uitloggen</span>}
        </Link>
      </div>
    </div>
  )
}