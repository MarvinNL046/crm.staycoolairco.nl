"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, X, Filter, Calendar, User, MapPin, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AppointmentSearchProps {
  appointments: any[]
  onSearchResults: (results: any[]) => void
  onAppointmentClick?: (appointment: any) => void
}

const appointmentTypes = [
  { value: 'meeting', label: 'Afspraak', color: '#3B82F6' },
  { value: 'call', label: 'Telefoongesprek', color: '#8B5CF6' },
  { value: 'visit', label: 'Bezoek', color: '#EC4899' },
  { value: 'installation', label: 'Installatie', color: '#10B981' },
  { value: 'service', label: 'Service', color: '#F59E0B' },
  { value: 'other', label: 'Overig', color: '#6B7280' }
]

const statusOptions = [
  { value: 'scheduled', label: 'Gepland' },
  { value: 'completed', label: 'Voltooid' },
  { value: 'cancelled', label: 'Geannuleerd' },
  { value: 'no-show', label: 'Niet verschenen' }
]

export function AppointmentSearch({ appointments, onSearchResults, onAppointmentClick }: AppointmentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['scheduled'])
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const searchRef = useRef<HTMLDivElement>(null)

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Perform search when filters change
  useEffect(() => {
    performSearch()
  }, [searchTerm, selectedTypes, selectedStatuses, dateFilter, appointments])

  const performSearch = () => {
    setIsSearching(true)
    
    let results = [...appointments]
    
    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      results = results.filter(apt => 
        apt.title?.toLowerCase().includes(term) ||
        apt.description?.toLowerCase().includes(term) ||
        apt.location?.toLowerCase().includes(term) ||
        apt.notes?.toLowerCase().includes(term)
      )
    }
    
    // Type filter
    if (selectedTypes.length > 0) {
      results = results.filter(apt => selectedTypes.includes(apt.type))
    }
    
    // Status filter
    if (selectedStatuses.length > 0) {
      results = results.filter(apt => selectedStatuses.includes(apt.status))
    }
    
    // Date filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    const monthFromNow = new Date(today)
    monthFromNow.setMonth(monthFromNow.getMonth() + 1)
    
    switch (dateFilter) {
      case 'today':
        results = results.filter(apt => {
          const aptDate = new Date(apt.start_time)
          return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        })
        break
      case 'week':
        results = results.filter(apt => {
          const aptDate = new Date(apt.start_time)
          return aptDate >= today && aptDate < weekFromNow
        })
        break
      case 'month':
        results = results.filter(apt => {
          const aptDate = new Date(apt.start_time)
          return aptDate >= today && aptDate < monthFromNow
        })
        break
    }
    
    // Sort by date
    results.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    
    setSearchResults(results)
    onSearchResults(results)
    setIsSearching(false)
    
    if (searchTerm.trim() || selectedTypes.length > 0 || dateFilter !== 'all') {
      setShowResults(true)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSelectedTypes([])
    setSelectedStatuses(['scheduled'])
    setDateFilter('all')
    setShowResults(false)
    onSearchResults(appointments)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const activeFiltersCount = selectedTypes.length + (dateFilter !== 'all' ? 1 : 0) + 
    (selectedStatuses.length !== 1 || selectedStatuses[0] !== 'scheduled' ? 1 : 0)

  return (
    <div ref={searchRef} className="relative">
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Zoek afspraken..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="pl-9 pr-9"
          />
          {(searchTerm || activeFiltersCount > 0) && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter opties</DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-gray-500">Type</DropdownMenuLabel>
            {appointmentTypes.map(type => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => toggleType(type.value)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  {type.label}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-gray-500">Status</DropdownMenuLabel>
            {statusOptions.map(status => (
              <DropdownMenuCheckboxItem
                key={status.value}
                checked={selectedStatuses.includes(status.value)}
                onCheckedChange={() => toggleStatus(status.value)}
              >
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs text-gray-500">Periode</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setDateFilter('all')}>
              <span className={cn(dateFilter === 'all' && 'font-semibold')}>Alle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter('today')}>
              <span className={cn(dateFilter === 'today' && 'font-semibold')}>Vandaag</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter('week')}>
              <span className={cn(dateFilter === 'week' && 'font-semibold')}>Deze week</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter('month')}>
              <span className={cn(dateFilter === 'month' && 'font-semibold')}>Deze maand</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchTerm || activeFiltersCount > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-w-2xl z-50">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {isSearching ? 'Zoeken...' : `${searchResults.length} resultaten gevonden`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
              >
                Sluiten
              </Button>
            </div>
          </div>
          
          <ScrollArea className="max-h-96">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Geen afspraken gevonden
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((appointment) => {
                  const startTime = new Date(appointment.start_time)
                  const typeInfo = appointmentTypes.find(t => t.value === appointment.type)
                  
                  return (
                    <button
                      key={appointment.id}
                      onClick={() => {
                        onAppointmentClick?.(appointment)
                        setShowResults(false)
                      }}
                      className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {appointment.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(startTime, 'd MMM yyyy', { locale: nl })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(startTime, 'HH:mm', { locale: nl })}
                            </span>
                            {appointment.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {appointment.location}
                              </span>
                            )}
                          </div>
                          {appointment.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {appointment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {typeInfo && (
                            <Badge 
                              style={{ 
                                backgroundColor: typeInfo.color,
                                color: 'white'
                              }}
                            >
                              {typeInfo.label}
                            </Badge>
                          )}
                          {appointment.status !== 'scheduled' && (
                            <Badge variant="outline" className="text-xs">
                              {statusOptions.find(s => s.value === appointment.status)?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}