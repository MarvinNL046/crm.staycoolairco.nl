"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart3,
  Building2,
  Calendar,
  FileText,
  Home,
  PlusCircle,
  Settings,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Mail,
  Receipt,
  Workflow,
  Zap,
  BookOpen,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Palette
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggleSimple } from "@/components/theme/theme-toggle"
import { useSidebarStatsContext } from "@/contexts/SidebarStatsContext"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Static menu structure - badges will be populated dynamically
const menuItemsStructure = [
  {
    title: "Dashboard",
    url: "/crm",
    icon: Home,
    key: null,
  },
  {
    title: "Leads",
    url: "/crm/leads",
    icon: UserCheck,
    key: "leads",
  },
  {
    title: "Contacten",
    url: "/crm/contacts",
    icon: Users,
    key: "contacts",
  },
  {
    title: "Bedrijven",
    url: "/crm/companies",
    icon: Building2,
    key: "companies",
  },
  {
    title: "Deals",
    url: "/crm/deals",
    icon: TrendingUp,
    key: "deals",
  },
  {
    title: "Offertes",
    url: "/crm/quotes",
    icon: FileText,
    key: "quotes",
  },
  {
    title: "Facturen",
    url: "/crm/invoices",
    icon: Receipt,
    key: "invoices",
  },
  {
    title: "Uitgaven",
    url: "/crm/expenses",
    icon: DollarSign,
    key: "expenses",
  },
]

const analyticsItems = [
  {
    title: "Analyses",
    url: "/crm/analytics",
    icon: BarChart3,
  },
  {
    title: "Omzet",
    url: "/crm/revenue",
    icon: DollarSign,
  },
  {
    title: "E-mail Campagnes",
    url: "/crm/campaigns",
    icon: Mail,
  },
]

const automationItems = [
  {
    title: "Automatiseringen",
    url: "/crm/automations",
    icon: Zap,
  },
  {
    title: "Workflow Bouwer",
    url: "/crm/workflows",
    icon: Workflow,
  },
]

const toolsItems = [
  {
    title: "Agenda",
    url: "/crm/calendar",
    icon: Calendar,
  },
  {
    title: "Snel Toevoegen",
    url: "/crm/quick-add",
    icon: PlusCircle,
  },
  {
    title: "Instellingen",
    url: "/crm/settings",
    icon: Settings,
  },
  {
    title: "Documentatie",
    url: "/crm/docs",
    icon: BookOpen,
  },
  {
    title: "Help",
    url: "/crm/help",
    icon: HelpCircle,
  },
]

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export function CRMSidebar() {
  const { stats, loading } = useSidebarStatsContext()
  const { open } = useSidebar()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          // Get profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .eq('id', authUser.id)
            .single()
          
          if (profile) {
            setUser(profile)
          } else {
            // Fallback to auth user data
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setUserLoading(false)
      }
    }

    getUser()
  }, [supabase])

  // Create menu items with live data
  const menuItems = menuItemsStructure.map(item => ({
    ...item,
    badge: item.key && stats ? stats[item.key as keyof typeof stats]?.badge : null
  }))

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
        <div className={cn(
          "flex items-center gap-2 px-4 py-3",
          !open && "justify-center px-2"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm dark:from-primary/90 dark:to-primary/70">
            <Building2 className="h-5 w-5" />
          </div>
          {open && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-base">StayCool CRM</span>
              <span className="truncate text-xs text-muted-foreground">
                Airconditioning
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          {open && <SidebarGroupLabel>CRM</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {open && (
                        <>
                          <span>{item.title}</span>
                          {loading && item.key ? (
                            <Skeleton className="ml-auto h-5 w-6 rounded-full" />
                          ) : (
                            item.badge && (
                              <Badge variant={item.badge.variant} className="ml-auto text-xs">
                                {item.badge.count}
                              </Badge>
                            )
                          )}
                        </>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {open && <SidebarGroupLabel>Analyses</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {open && <SidebarGroupLabel>Automatisering</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {automationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {open && <SidebarGroupLabel>Hulpmiddelen</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Toggle Controls */}
      <div className="border-t">
        <div className={cn(
          "p-4 space-y-2",
          !open && "px-2"
        )}>
          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center rounded-lg hover:bg-accent/50 p-2 transition-colors",
            open ? "justify-between" : "justify-center"
          )}>
            {open && (
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Thema</span>
              </div>
            )}
            <ThemeToggleSimple />
          </div>
          
          {/* Sidebar Toggle */}
          <div className={cn(
            "flex items-center rounded-lg hover:bg-accent/50 p-2 transition-colors",
            open ? "justify-between" : "justify-center"
          )}>
            {open && (
              <div className="flex items-center gap-2">
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Menu verkleinen</span>
              </div>
            )}
            <SidebarTrigger className="h-8 w-8 hover:bg-accent rounded-md transition-colors" />
          </div>
        </div>
      </div>

      <SidebarFooter className="border-t">
        <div className={cn(
          "flex items-center gap-2 p-4",
          !open && "justify-center px-2"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || 'User'} />
            <AvatarFallback>
              {userLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : (
                user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) :
                user?.email ? user.email.split('@')[0].slice(0, 2).toUpperCase() : 'U'
              )}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              {userLoading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <span className="truncate font-semibold">
                    {user?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || 'Geen email'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}