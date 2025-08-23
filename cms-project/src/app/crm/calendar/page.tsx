"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Phone,
  Users,
  Settings,
  Filter
} from "lucide-react"
import { toast } from "sonner"
import { NewAppointmentDialog } from '@/components/calendar/NewAppointmentDialog'
import { EditAppointmentDialog } from '@/components/appointments/EditAppointmentDialog'
import { WeekView } from '@/components/calendar/WeekViewWithDragDrop'
import { DayView } from '@/components/calendar/DayViewWithDragDrop'
import { AppointmentSearch } from '@/components/calendar/AppointmentSearch'

// Dutch month and day names
const monthNames = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
]

const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
const fullDayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

// Mock appointments for now
const mockAppointments = [
  {
    id: '1',
    title: 'Offerte bespreking - Bakkerij Janssen',
    start_time: new Date(2024, 11, 20, 10, 0),
    end_time: new Date(2024, 11, 20, 11, 0),
    type: 'meeting',
    location: 'Bij klant',
    lead_id: '1',
    color: '#3B82F6',
    all_day: false
  },
  {
    id: '2',
    title: 'Installatie airco - Hotel Zonneschijn',
    start_time: new Date(2024, 11, 21, 9, 0),
    end_time: new Date(2024, 11, 21, 17, 0),
    type: 'installation',
    location: 'Rotterdam',
    customer_id: '3',
    color: '#10B981',
    all_day: false
  },
  {
    id: '3',
    title: 'Service onderhoud - Restaurant Groen',
    start_time: new Date(2024, 11, 22, 14, 0),
    end_time: new Date(2024, 11, 22, 16, 0),
    type: 'service',
    location: 'Utrecht',
    customer_id: '2',
    color: '#F59E0B',
    all_day: false
  },
  {
    id: '4',
    title: 'Planning dag',
    start_time: new Date(2024, 11, 23, 0, 0),
    end_time: new Date(2024, 11, 23, 23, 59),
    type: 'other',
    location: '',
    color: '#6B7280',
    all_day: true
  }
]

// Type colors
const typeColors = {
  meeting: '#3B82F6',
  call: '#8B5CF6',
  visit: '#EC4899',
  installation: '#10B981',
  service: '#F59E0B',
  other: '#6B7280'
}

const typeLabels = {
  meeting: 'Afspraak',
  call: 'Telefoongesprek',
  visit: 'Bezoek',
  installation: 'Installatie',
  service: 'Service',
  other: 'Overig'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [appointments, setAppointments] = useState<any[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showEditAppointment, setShowEditAppointment] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Fetch appointments from Supabase
  useEffect(() => {
    fetchAppointments()
    fetchCustomers()
  }, [currentDate])

  const fetchAppointments = async () => {
    try {
      // Calculate date range for current month view
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
      
      const response = await fetch(`/api/appointments?tenant_id=80496bff-b559-4b80-9102-3a84afdaa616`)
      if (!response.ok) throw new Error('Failed to fetch appointments')
      
      const data = await response.json()
      const appointmentsData = data.appointments || []
      
      // Convert date strings to Date objects and add colors
      const processedAppointments = appointmentsData.map((apt: any) => ({
        ...apt,
        start_time: new Date(apt.start_time),
        end_time: new Date(apt.end_time),
        color: apt.color || typeColors[apt.type as keyof typeof typeColors] || '#3B82F6'
      }))
      
      setAppointments(processedAppointments)
      setFilteredAppointments(processedAppointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      // Fall back to mock data if fetch fails
      setAppointments(mockAppointments)
      setFilteredAppointments(mockAppointments)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  // Get calendar grid for month view
  const getMonthGrid = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    // Use filtered appointments if search is active
    const appointmentsToUse = showSearch ? filteredAppointments : appointments
    return appointmentsToUse.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedDate(date)
    setShowNewAppointment(true)
  }

  const today = new Date()
  const monthGrid = getMonthGrid()

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Google Calendar Style Header */}
      <div className="border-b flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Logo/Title Area */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-normal text-gray-700">Agenda</h1>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="font-medium"
            >
              Vandaag
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateCalendar('prev')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateCalendar('next')}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-xl font-normal min-w-[200px] text-center">
              {view === 'day' 
                ? format(currentDate, 'd MMMM yyyy', { locale: nl })
                : view === 'week'
                ? `Week ${format(currentDate, 'w, yyyy', { locale: nl })}`
                : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Search Component */}
          <div className="mr-4">
            <AppointmentSearch
              appointments={appointments}
              onSearchResults={(results) => {
                setFilteredAppointments(results)
                setShowSearch(true)
              }}
              onAppointmentClick={(apt) => {
                setSelectedAppointment(apt)
                setShowEditAppointment(true)
                setShowSearch(false)
              }}
            />
          </div>
          
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="border-l pl-3 flex items-center gap-1">
            <Button
              variant={view === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="font-medium"
            >
              Dag
            </Button>
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="font-medium"
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="font-medium"
            >
              Maand
            </Button>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-gray-50 p-4 space-y-4">
          {/* Create Button */}
          <Button 
            className="w-full bg-white hover:bg-gray-100 text-gray-700 border shadow-sm rounded-full py-6 font-normal"
            onClick={() => setShowNewAppointment(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Maken
          </Button>

          {/* Mini Calendar */}
          <div className="bg-white rounded-lg border p-3">
            <div className="text-sm font-medium mb-2">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['Z', 'M', 'D', 'W', 'D', 'V', 'Z'].map((day, i) => (
                <div key={i} className="text-center text-gray-500 py-1">
                  {day}
                </div>
              ))}
              {monthGrid.slice(0, 35).map((date, i) => (
                <div
                  key={i}
                  className={`text-center py-1 cursor-pointer rounded hover:bg-gray-100 ${
                    date.toDateString() === today.toDateString() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : date.getMonth() !== currentDate.getMonth() 
                        ? 'text-gray-400' 
                        : ''
                  }`}
                  onClick={() => setCurrentDate(date)}
                >
                  {date.getDate()}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Types */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">Mijn agenda's</div>
            {Object.entries(typeLabels).map(([type, label]) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded"
                  style={{ accentColor: typeColors[type as keyof typeof typeColors] }}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">Agenda laden...</p>
              </div>
            </div>
          ) : view === 'month' ? (
            <div className="h-full flex flex-col">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b bg-white sticky top-0 z-10">
                {fullDayNames.map((day, index) => (
                  <div
                    key={day}
                    className={`px-2 py-3 text-xs font-medium uppercase tracking-wider ${
                      index === 0 || index === 6 ? 'text-gray-500' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                {monthGrid.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                  const isToday = date.toDateString() === today.toDateString()
                  const dayAppointments = getAppointmentsForDate(date)
                  
                  return (
                    <div
                      key={index}
                      className={`border-b border-r p-1 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                      onClick={() => {
                        setSelectedDate(date)
                        setShowNewAppointment(true)
                      }}
                    >
                      <div className={`text-sm mb-1 flex items-center justify-center ${
                        isToday 
                          ? 'bg-blue-600 text-white rounded-full w-6 h-6' 
                          : !isCurrentMonth 
                            ? 'text-gray-400' 
                            : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      {/* Appointments */}
                      <div className="space-y-0.5">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <div
                            key={apt.id}
                            className="text-xs px-1 py-0.5 rounded cursor-pointer truncate font-medium"
                            style={{ 
                              backgroundColor: apt.color,
                              color: 'white'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAppointment(apt)
                              setShowEditAppointment(true)
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedAppointment(apt)
                              setShowEditAppointment(true)
                            }}
                            title="Klik of rechtsklik om te bewerken"
                          >
                            {apt.all_day ? (
                              <span>{apt.title}</span>
                            ) : (
                              <>
                                {apt.start_time.toLocaleTimeString('nl-NL', { 
                                  hour: 'numeric',
                                  minute: '2-digit' 
                                })}
                                {' '}
                                {apt.title}
                              </>
                            )}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-gray-500 pl-1">
                            +{dayAppointments.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : view === 'week' ? (
            <WeekView
              currentDate={currentDate}
              appointments={showSearch ? filteredAppointments : appointments}
              onAppointmentClick={(apt) => {
                setSelectedAppointment(apt)
                setShowEditAppointment(true)
              }}
              onTimeSlotClick={handleTimeSlotClick}
              onAppointmentUpdate={fetchAppointments}
            />
          ) : (
            <DayView
              currentDate={currentDate}
              appointments={showSearch ? filteredAppointments : appointments}
              onAppointmentClick={(apt) => {
                setSelectedAppointment(apt)
                setShowEditAppointment(true)
              }}
              onTimeSlotClick={handleTimeSlotClick}
              onDateChange={setCurrentDate}
              onAppointmentUpdate={fetchAppointments}
            />
          )}
        </div>
      </div>

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={showNewAppointment}
        onOpenChange={setShowNewAppointment}
        selectedDate={selectedDate || currentDate}
        onSuccess={() => {
          fetchAppointments()
          toast.success('Afspraak succesvol aangemaakt')
        }}
      />

      {/* Edit Appointment Dialog */}
      <EditAppointmentDialog
        appointment={selectedAppointment}
        isOpen={showEditAppointment}
        onClose={() => {
          setShowEditAppointment(false)
          setSelectedAppointment(null)
        }}
        onUpdate={() => {
          fetchAppointments()
          setShowEditAppointment(false)
          setSelectedAppointment(null)
        }}
        customers={customers}
      />

    </div>
  )
}