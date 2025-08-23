"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon, Clock, Mail, Bell, X } from "lucide-react"
import { toast } from "sonner"
import { RecurrenceSettings } from "./RecurrenceSettings"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface NewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  onSuccess?: () => void
}

const appointmentTypes = [
  { value: 'meeting', label: 'Afspraak', color: '#3B82F6' },
  { value: 'call', label: 'Telefoongesprek', color: '#8B5CF6' },
  { value: 'visit', label: 'Bezoek', color: '#EC4899' },
  { value: 'installation', label: 'Installatie', color: '#10B981' },
  { value: 'service', label: 'Service', color: '#F59E0B' },
  { value: 'other', label: 'Overig', color: '#6B7280' }
]

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
]

export function NewAppointmentDialog({ 
  open, 
  onOpenChange, 
  selectedDate = new Date(),
  onSuccess 
}: NewAppointmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: selectedDate,
    startTime: '10:00',
    endTime: '11:00',
    type: 'meeting',
    leadId: '',
    notes: '',
    reminderMinutes: [60], // Default 1 hour before
    reminderEmails: [] as string[],
    recurrence: null as any
  })
  const [customReminderEmail, setCustomReminderEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error('Titel is verplicht')
      return
    }

    setLoading(true)

    try {
      // Combine date and time
      const [startHour, startMin] = formData.startTime.split(':')
      const [endHour, endMin] = formData.endTime.split(':')
      
      const startDateTime = new Date(formData.date)
      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0)
      
      const endDateTime = new Date(formData.date)
      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0)

      const selectedType = appointmentTypes.find(t => t.value === formData.type)

      const appointmentData = {
        tenant_id: '80496bff-b559-4b80-9102-3a84afdaa616', // TODO: Get from auth
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: formData.type,
        color: selectedType?.color || '#3B82F6',
        lead_id: formData.leadId || null,
        notes: formData.notes,
        reminder_minutes: formData.reminderMinutes.length > 0 ? formData.reminderMinutes : null,
        reminder_emails: formData.reminderEmails.length > 0 ? formData.reminderEmails : null,
        // Add recurrence fields if set
        ...(formData.recurrence ? {
          is_recurring: true,
          recurrence_pattern: formData.recurrence.pattern,
          recurrence_interval: formData.recurrence.interval,
          recurrence_days_of_week: formData.recurrence.daysOfWeek,
          recurrence_day_of_month: formData.recurrence.dayOfMonth,
          recurrence_month_of_year: formData.recurrence.monthOfYear,
          recurrence_end_date: formData.recurrence.endDate,
          recurrence_count: formData.recurrence.count,
          recurrence_id: crypto.randomUUID() // Generate unique ID for the series
        } : {})
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        throw new Error('Failed to create appointment')
      }

      toast.success('Afspraak aangemaakt')
      onOpenChange(false)
      onSuccess?.()
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        date: selectedDate,
        startTime: '10:00',
        endTime: '11:00',
        type: 'meeting',
        leadId: '',
        notes: '',
        reminderMinutes: [60],
        reminderEmails: [],
        recurrence: null
      })
      setCustomReminderEmail('')
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Fout bij aanmaken afspraak')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nieuwe Afspraak</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe afspraak toe aan je agenda
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Bijv. Offerte bespreking - Bakkerij Janssen"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "dd MMM yyyy", { locale: nl }) : "Kies datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData({...formData, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Start tijd</Label>
                <Select
                  value={formData.startTime}
                  onValueChange={(value) => setFormData({...formData, startTime: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Eind tijd</Label>
                <Select
                  value={formData.endTime}
                  onValueChange={(value) => setFormData({...formData, endTime: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Locatie</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Bijv. Bij klant, Kantoor, Online"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Extra informatie over de afspraak..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Interne notities..."
                rows={2}
              />
            </div>

            {/* Recurrence Settings */}
            <RecurrenceSettings
              value={formData.recurrence}
              onChange={(recurrence) => setFormData({...formData, recurrence})}
              startDate={formData.date}
            />

            {/* Email Reminders */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Email herinneringen
              </Label>
              <div className="space-y-2 pl-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder-15"
                    checked={formData.reminderMinutes.includes(15)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({...formData, reminderMinutes: [...formData.reminderMinutes, 15].sort((a, b) => a - b)})
                      } else {
                        setFormData({...formData, reminderMinutes: formData.reminderMinutes.filter(m => m !== 15)})
                      }
                    }}
                  />
                  <Label htmlFor="reminder-15" className="text-sm font-normal">15 minuten van tevoren</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder-60"
                    checked={formData.reminderMinutes.includes(60)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({...formData, reminderMinutes: [...formData.reminderMinutes, 60].sort((a, b) => a - b)})
                      } else {
                        setFormData({...formData, reminderMinutes: formData.reminderMinutes.filter(m => m !== 60)})
                      }
                    }}
                  />
                  <Label htmlFor="reminder-60" className="text-sm font-normal">1 uur van tevoren</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reminder-1440"
                    checked={formData.reminderMinutes.includes(1440)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({...formData, reminderMinutes: [...formData.reminderMinutes, 1440].sort((a, b) => a - b)})
                      } else {
                        setFormData({...formData, reminderMinutes: formData.reminderMinutes.filter(m => m !== 1440)})
                      }
                    }}
                  />
                  <Label htmlFor="reminder-1440" className="text-sm font-normal">1 dag van tevoren</Label>
                </div>
              </div>
              
              {/* Custom reminder emails */}
              {formData.reminderMinutes.length > 0 && (
                <div className="space-y-2 pl-6">
                  <Label className="text-sm">Extra email adressen voor herinneringen</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@voorbeeld.nl"
                      value={customReminderEmail}
                      onChange={(e) => setCustomReminderEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customReminderEmail) {
                          e.preventDefault()
                          if (!formData.reminderEmails.includes(customReminderEmail)) {
                            setFormData({...formData, reminderEmails: [...formData.reminderEmails, customReminderEmail]})
                            setCustomReminderEmail('')
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customReminderEmail && !formData.reminderEmails.includes(customReminderEmail)) {
                          setFormData({...formData, reminderEmails: [...formData.reminderEmails, customReminderEmail]})
                          setCustomReminderEmail('')
                        }
                      }}
                    >
                      Toevoegen
                    </Button>
                  </div>
                  {formData.reminderEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.reminderEmails.map((email, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-sm">
                          <Mail className="h-3 w-3" />
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({...formData, reminderEmails: formData.reminderEmails.filter((_, i) => i !== index)})
                            }}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Aanmaken...' : 'Afspraak Aanmaken'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}