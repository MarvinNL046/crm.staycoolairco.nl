"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Search,
  UserCheck,
  Users,
  Building2,
  FileText,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Hash,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface SearchResult {
  id: string
  type: 'lead' | 'contact' | 'company' | 'invoice' | 'deal' | 'appointment'
  title: string
  subtitle?: string
  status?: string
  value?: number
  date?: string
  url: string
}

export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      performSearch(search)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const performSearch = async (query: string) => {
    setLoading(true)
    
    try {
      const tenantId = '80496bff-b559-4b80-9102-3a84afdaa616'
      
      // Search all entities in parallel
      const [leadsRes, invoicesRes, appointmentsRes] = await Promise.all([
        fetch(`/api/leads?tenant_id=${tenantId}`),
        fetch(`/api/invoices?tenant_id=${tenantId}`),
        fetch(`/api/appointments?tenant_id=${tenantId}`)
      ])

      const [leadsData, invoicesData, appointmentsData] = await Promise.all([
        leadsRes.json(),
        invoicesRes.json(),
        appointmentsRes.json()
      ])

      const searchResults: SearchResult[] = []
      const lowerQuery = query.toLowerCase()

      // Search leads
      if (leadsData.leads) {
        const matchingLeads = leadsData.leads.filter((lead: any) => 
          lead.name?.toLowerCase().includes(lowerQuery) ||
          lead.email?.toLowerCase().includes(lowerQuery) ||
          lead.company?.toLowerCase().includes(lowerQuery) ||
          lead.phone?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5).map((lead: any) => ({
          id: lead.id,
          type: 'lead' as const,
          title: lead.name || 'Naamloos',
          subtitle: lead.company || lead.email,
          status: lead.status,
          url: `/crm/leads?id=${lead.id}`
        }))
        searchResults.push(...matchingLeads)
      }

      // Search invoices
      if (invoicesData.invoices) {
        const matchingInvoices = invoicesData.invoices.filter((invoice: any) =>
          invoice.invoiceNumber?.toLowerCase().includes(lowerQuery) ||
          invoice.customerName?.toLowerCase().includes(lowerQuery) ||
          invoice.totalAmount?.toString().includes(query)
        ).slice(0, 5).map((invoice: any) => ({
          id: invoice.id,
          type: 'invoice' as const,
          title: `Factuur #${invoice.invoiceNumber}`,
          subtitle: invoice.customerName,
          status: invoice.status,
          value: invoice.totalAmount,
          date: invoice.issueDate,
          url: `/crm/invoices?id=${invoice.id}`
        }))
        searchResults.push(...matchingInvoices)
      }

      // Search appointments
      if (appointmentsData.appointments) {
        const matchingAppointments = appointmentsData.appointments.filter((apt: any) =>
          apt.title?.toLowerCase().includes(lowerQuery) ||
          apt.location?.toLowerCase().includes(lowerQuery) ||
          apt.customer_name?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5).map((apt: any) => ({
          id: apt.id,
          type: 'appointment' as const,
          title: apt.title,
          subtitle: apt.customer_name || apt.location,
          date: apt.start_time,
          url: `/crm/calendar?id=${apt.id}`
        }))
        searchResults.push(...matchingAppointments)
      }

      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (url: string) => {
    router.push(url)
    setOpen(false)
    setSearch("")
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'lead': return UserCheck
      case 'contact': return Users
      case 'company': return Building2
      case 'invoice': return FileText
      case 'deal': return DollarSign
      case 'appointment': return Calendar
      default: return Search
    }
  }

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'lead': return 'Lead'
      case 'contact': return 'Contact'
      case 'company': return 'Bedrijf'
      case 'invoice': return 'Factuur'
      case 'deal': return 'Deal'
      case 'appointment': return 'Afspraak'
      default: return 'Overig'
    }
  }

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'new': return 'default'
      case 'contacted': return 'secondary'
      case 'qualified': return 'outline'
      case 'won': return 'default'
      case 'lost': return 'destructive'
      case 'paid': return 'default'
      case 'pending': return 'secondary'
      case 'overdue': return 'destructive'
      default: return 'outline'
    }
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Zoek leads, contacten, facturen..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : search.length < 2 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-sm">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Typ minimaal 2 karakters om te zoeken</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Gebruik <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd> om snel te zoeken
              </p>
            </div>
          </CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-sm">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Geen resultaten gevonden voor "{search}"</p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {Object.entries(groupedResults).map(([type, items], index) => {
              const Icon = getIcon(type as SearchResult['type'])
              const label = getTypeLabel(type as SearchResult['type'])
              
              return (
                <div key={type}>
                  {index > 0 && <CommandSeparator />}
                  <CommandGroup heading={label}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() => handleSelect(item.url)}
                        className="flex items-center gap-2 py-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.title}</span>
                            {item.status && (
                              <Badge variant={getStatusVariant(item.status)} className="text-xs">
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          {(item.subtitle || item.value || item.date) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.subtitle && <span>{item.subtitle}</span>}
                              {item.value && (
                                <>
                                  {item.subtitle && <span>•</span>}
                                  <span>€{item.value.toLocaleString('nl-NL')}</span>
                                </>
                              )}
                              {item.date && (
                                <>
                                  {(item.subtitle || item.value) && <span>•</span>}
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(item.date).toLocaleDateString('nl-NL')}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              )
            })}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}