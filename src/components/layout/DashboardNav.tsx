'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Menu, X, ChevronDown, Users, MessageSquare, Zap, Settings, LogOut, BarChart3, Search } from 'lucide-react'

interface DashboardNavProps {
  user: User
  tenants: any[]
}

export default function DashboardNav({ user, tenants }: DashboardNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Voor nu gebruiken we de eerste tenant
  const currentTenant = tenants[0]?.tenants

  const navigation = [
    { name: 'Pipeline', href: '/dashboard', icon: BarChart3 },
    { name: 'Leads', href: '/dashboard/leads', icon: Search },
    { name: 'Berichten', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Automatisering', href: '/dashboard/automations', icon: Zap },
    { name: 'Instellingen', href: '/dashboard/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                StayCool CRM
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentTenant && (
                <span className="mr-4 text-sm text-gray-500">
                  {currentTenant.name}
                </span>
              )}
              
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-100">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </button>
                </div>
                
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Uitloggen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-gray-200 pb-3 pt-4">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {user.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.email}</div>
                {currentTenant && (
                  <div className="text-sm font-medium text-gray-500">{currentTenant.name}</div>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}