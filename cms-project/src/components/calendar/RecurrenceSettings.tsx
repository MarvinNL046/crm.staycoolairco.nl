"use client"

import { useState, useEffect } from 'react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface RecurrenceSettingsProps {
  value?: {
    pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    daysOfWeek?: number[]
    dayOfMonth?: number
    monthOfYear?: number
    endDate?: Date
    count?: number
    endType?: 'never' | 'date' | 'count'
  }
  onChange: (value: any) => void
  startDate?: Date
}

const weekDays = [
  { value: 0, label: 'Zo', fullLabel: 'Zondag' },
  { value: 1, label: 'Ma', fullLabel: 'Maandag' },
  { value: 2, label: 'Di', fullLabel: 'Dinsdag' },
  { value: 3, label: 'Wo', fullLabel: 'Woensdag' },
  { value: 4, label: 'Do', fullLabel: 'Donderdag' },
  { value: 5, label: 'Vr', fullLabel: 'Vrijdag' },
  { value: 6, label: 'Za', fullLabel: 'Zaterdag' },
]

const months = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maart' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Augustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function RecurrenceSettings({ value = {}, onChange, startDate = new Date() }: RecurrenceSettingsProps) {
  const [isRecurring, setIsRecurring] = useState(!!value.pattern)
  const [pattern, setPattern] = useState(value.pattern || 'weekly')
  const [interval, setInterval] = useState(value.interval || 1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value.daysOfWeek || [startDate.getDay()])
  const [dayOfMonth, setDayOfMonth] = useState(value.dayOfMonth || startDate.getDate())
  const [monthOfYear, setMonthOfYear] = useState(value.monthOfYear || startDate.getMonth() + 1)
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>(
    value.endDate ? 'date' : value.count ? 'count' : 'never'
  )
  const [endDate, setEndDate] = useState<Date | undefined>(value.endDate)
  const [count, setCount] = useState(value.count || 10)

  useEffect(() => {
    if (!isRecurring) {
      onChange(null)
      return
    }

    const recurrence: any = {
      pattern,
      interval,
    }

    switch (pattern) {
      case 'weekly':
        recurrence.daysOfWeek = daysOfWeek
        break
      case 'monthly':
        recurrence.dayOfMonth = dayOfMonth
        break
      case 'yearly':
        recurrence.dayOfMonth = dayOfMonth
        recurrence.monthOfYear = monthOfYear
        break
    }

    switch (endType) {
      case 'date':
        if (endDate) recurrence.endDate = endDate
        break
      case 'count':
        recurrence.count = count
        break
    }

    onChange(recurrence)
  }, [isRecurring, pattern, interval, daysOfWeek, dayOfMonth, monthOfYear, endType, endDate, count])

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const getPatternLabel = () => {
    switch (pattern) {
      case 'daily':
        return interval === 1 ? 'dag' : 'dagen'
      case 'weekly':
        return interval === 1 ? 'week' : 'weken'
      case 'monthly':
        return interval === 1 ? 'maand' : 'maanden'
      case 'yearly':
        return interval === 1 ? 'jaar' : 'jaar'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Enable Recurring */}
      <div className="flex items-center justify-between">
        <Label htmlFor="recurring" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Terugkerende afspraak
        </Label>
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
      </div>

      {isRecurring && (
        <div className="space-y-4 pl-6 border-l-2 border-gray-200">
          {/* Pattern Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pattern">Herhaal elke</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="99"
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pattern-type">&nbsp;</Label>
              <Select value={pattern} onValueChange={(v: any) => setPattern(v)}>
                <SelectTrigger id="pattern-type" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{getPatternLabel()}</SelectItem>
                  <SelectItem value="weekly">{interval === 1 ? 'week' : 'weken'}</SelectItem>
                  <SelectItem value="monthly">{interval === 1 ? 'maand' : 'maanden'}</SelectItem>
                  <SelectItem value="yearly">{interval === 1 ? 'jaar' : 'jaar'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weekly: Day Selection */}
          {pattern === 'weekly' && (
            <div>
              <Label>Op deze dagen</Label>
              <div className="flex gap-2 mt-2">
                {weekDays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={cn(
                      "w-10 h-10 rounded-full text-sm font-medium transition-colors",
                      daysOfWeek.includes(day.value)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    title={day.fullLabel}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: Day of Month */}
          {pattern === 'monthly' && (
            <div>
              <Label htmlFor="day-of-month">Op dag van de maand</Label>
              <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                <SelectTrigger id="day-of-month" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Yearly: Month and Day */}
          {pattern === 'yearly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">In maand</Label>
                <Select value={monthOfYear.toString()} onValueChange={(v) => setMonthOfYear(parseInt(v))}>
                  <SelectTrigger id="month" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yearly-day">Op dag</Label>
                <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                  <SelectTrigger id="yearly-day" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* End Options */}
          <div>
            <Label>Eindigt</Label>
            <RadioGroup value={endType} onValueChange={(v: any) => setEndType(v)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="font-normal">Nooit</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="date" />
                <Label htmlFor="date" className="font-normal">Op datum</Label>
                {endType === 'date' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "ml-4 justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "d MMMM yyyy", { locale: nl }) : "Selecteer datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count" className="font-normal">Na</Label>
                {endType === 'count' && (
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={count}
                      onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20"
                    />
                    <span className="text-sm">keer</span>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Voorbeeld:</strong> Deze afspraak herhaalt zich{' '}
              {interval > 1 && `elke ${interval} `}
              {pattern === 'daily' && (interval === 1 ? 'dagelijks' : getPatternLabel())}
              {pattern === 'weekly' && (
                <>
                  {interval === 1 ? 'wekelijks' : getPatternLabel()} op{' '}
                  {daysOfWeek.map(d => weekDays.find(wd => wd.value === d)?.fullLabel).join(', ')}
                </>
              )}
              {pattern === 'monthly' && `${interval === 1 ? 'maandelijks' : getPatternLabel()} op de ${dayOfMonth}e`}
              {pattern === 'yearly' && (
                <>
                  {interval === 1 ? 'jaarlijks' : getPatternLabel()} op {dayOfMonth}{' '}
                  {months.find(m => m.value === monthOfYear)?.label}
                </>
              )}
              {endType === 'date' && endDate && ` tot ${format(endDate, 'd MMMM yyyy', { locale: nl })}`}
              {endType === 'count' && `, ${count} keer`}
              {endType === 'never' && ', zonder einddatum'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}