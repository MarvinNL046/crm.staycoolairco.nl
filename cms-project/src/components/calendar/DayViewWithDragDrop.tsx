'use client';

import { useState, useEffect, useRef } from 'react';
import { format, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { ResizableAppointment } from './ResizableAppointment';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  customer_id: string;
  status: string;
  location?: string;
  color?: string;
  customer?: {
    name: string;
  };
}

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onDateChange: (date: Date) => void;
  onAppointmentUpdate?: () => void;
}

export function DayView({
  currentDate,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  onDateChange,
  onAppointmentUpdate,
}: DayViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(currentDate);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount and when date changes
  useEffect(() => {
    scrollToCurrentTime();
  }, [currentDate]);

  const scrollToCurrentTime = () => {
    if (!scrollContainerRef.current) return;
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const scrollPosition = (hours + minutes / 60) * 60; // 60px per hour
    
    scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition - 200);
  };

  // All 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Get appointments for current day
  const dayAppointments = appointments.filter(apt => 
    isSameDay(new Date(apt.start_time), currentDate)
  );
  
  // Calculate appointment position and height
  const getAppointmentStyle = (appointment: Appointment) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = startHour * 60; // 60px per hour
    const height = (endHour - startHour) * 60;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      minHeight: '30px',
    };
  };
  
  // Get appointments that overlap
  const getOverlappingAppointments = (appointments: Appointment[]) => {
    const sorted = [...appointments].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    
    const positioned: Array<{ appointment: Appointment; column: number; totalColumns: number }> = [];
    
    sorted.forEach((apt) => {
      const aptStart = new Date(apt.start_time).getTime();
      const aptEnd = new Date(apt.end_time).getTime();
      
      // Find overlapping appointments
      const overlapping = positioned.filter((pos) => {
        const posStart = new Date(pos.appointment.start_time).getTime();
        const posEnd = new Date(pos.appointment.end_time).getTime();
        return aptStart < posEnd && aptEnd > posStart;
      });
      
      // Find first available column
      let column = 0;
      const usedColumns = overlapping.map(o => o.column).sort((a, b) => a - b);
      for (let i = 0; i <= usedColumns.length; i++) {
        if (!usedColumns.includes(i)) {
          column = i;
          break;
        }
      }
      
      // Update total columns for all overlapping appointments
      const totalColumns = Math.max(...overlapping.map(o => o.column), column) + 1;
      overlapping.forEach(o => {
        o.totalColumns = totalColumns;
      });
      
      positioned.push({ appointment: apt, column, totalColumns });
    });
    
    return positioned;
  };

  // Get current time line position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    return hours * 60;
  };

  // Mini calendar
  const miniCalendarDays = eachDayOfInterval({
    start: startOfMonth(miniCalendarDate),
    end: endOfMonth(miniCalendarDate),
  });

  const navigateMiniCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setMiniCalendarDate(newDate);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || isUpdating) {
      setActiveId(null);
      return;
    }

    const appointment = appointments.find(apt => apt.id === active.id);
    if (!appointment) {
      setActiveId(null);
      return;
    }

    const dropData = over.data.current;
    if (dropData?.hour === undefined) {
      setActiveId(null);
      return;
    }

    // Calculate new times
    const duration = new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime();
    
    const newStartTime = new Date(currentDate);
    newStartTime.setHours(dropData.hour, 0, 0, 0);
    
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Don't update if nothing changed
    if (newStartTime.getTime() === new Date(appointment.start_time).getTime()) {
      setActiveId(null);
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      toast.success('Afspraak verplaatst', {
        description: `Nieuwe tijd: ${format(newStartTime, 'HH:mm', { locale: nl })}`,
      });

      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Fout bij verplaatsen', {
        description: 'De afspraak kon niet worden verplaatst.',
      });
    } finally {
      setIsUpdating(false);
      setActiveId(null);
    }
  };

  const currentTimePosition = getCurrentTimePosition();
  const positionedAppointments = getOverlappingAppointments(dayAppointments);
  const activeAppointment = activeId ? appointments.find(apt => apt.id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex bg-white">
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {format(currentDate, 'EEEE d MMMM yyyy', { locale: nl })}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {dayAppointments.length} afspraken
                </p>
              </div>
              <Button
                variant="outline"
                onClick={scrollToCurrentTime}
              >
                Scroll naar nu
              </Button>
            </div>
          </div>

          {/* Time grid */}
          <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
            <div className="relative min-h-[1440px]"> {/* 24 * 60px */}
              {/* Time labels and grid */}
              {hours.map((hour) => (
                <div key={hour} className="relative">
                  <div className="flex h-[60px] border-b">
                    <div className="w-20 flex-shrink-0 pr-2 py-2 text-xs text-gray-500 text-right">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <DroppableTimeSlot
                      id={`hour-${hour}`}
                      date={currentDate}
                      hour={hour}
                      className="flex-1 border-l"
                      onClick={() => onTimeSlotClick(currentDate, `${hour}:00`)}
                    />
                  </div>
                </div>
              ))}

              {/* Current time indicator */}
              {isToday(currentDate) && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${currentTimePosition}px` }}
                >
                  <div className="flex">
                    <div className="w-20 flex-shrink-0 pr-2 text-right">
                      <div className="text-xs text-red-500 font-medium">
                        {format(currentTime, 'HH:mm')}
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute inset-x-0 h-0.5 bg-red-500">
                        <div className="absolute -left-2 -top-1 w-3 h-3 bg-red-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointments */}
              <div className="absolute inset-0 left-20 pointer-events-none">
                {positionedAppointments.map(({ appointment, column, totalColumns }) => {
                  const style = getAppointmentStyle(appointment);
                  const width = 100 / totalColumns;
                  const left = column * width;
                  
                  return (
                    <ResizableAppointment
                      key={appointment.id}
                      appointment={appointment}
                      style={{
                        ...style,
                        left: `${left}%`,
                        width: `${width}%`,
                        paddingRight: totalColumns > 1 ? '2px' : '0',
                      }}
                      onClick={() => onAppointmentClick(appointment)}
                      onResize={() => onAppointmentUpdate && onAppointmentUpdate()}
                      view="day"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with mini calendar */}
        <div className="w-80 border-l bg-gray-50 p-4">
          <div className="bg-white rounded-lg border p-4">
            {/* Mini calendar header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                {format(miniCalendarDate, 'MMMM yyyy', { locale: nl })}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => navigateMiniCalendar('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => navigateMiniCalendar('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {miniCalendarDays.map((day) => {
                const isSelected = isSameDay(day, currentDate);
                const isCurrentDay = isToday(day);
                const hasAppointments = appointments.some(apt => 
                  isSameDay(new Date(apt.start_time), day)
                );
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateChange(day)}
                    className={cn(
                      "relative h-8 w-8 rounded text-sm hover:bg-gray-100 transition-colors",
                      isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                      isCurrentDay && !isSelected && "bg-blue-100 text-blue-600",
                      day.getMonth() !== miniCalendarDate.getMonth() && "text-gray-400"
                    )}
                  >
                    {day.getDate()}
                    {hasAppointments && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's summary */}
          <div className="mt-4 bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-3">Samenvatting vandaag</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Totaal afspraken:</span>
                <span className="font-medium">{dayAppointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Voltooid:</span>
                <span className="font-medium text-green-600">
                  {dayAppointments.filter(a => a.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gepland:</span>
                <span className="font-medium text-blue-600">
                  {dayAppointments.filter(a => a.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Geannuleerd:</span>
                <span className="font-medium text-red-600">
                  {dayAppointments.filter(a => a.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 space-y-2">
            <Button 
              className="w-full"
              onClick={() => onTimeSlotClick(currentDate, format(new Date(), 'HH:00'))}
            >
              Nieuwe afspraak vandaag
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onDateChange(new Date())}
            >
              Ga naar vandaag
            </Button>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeAppointment ? (
          <div
            className="rounded-lg p-2 text-white shadow-lg"
            style={{
              backgroundColor: activeAppointment.color || '#3B82F6',
              width: '200px',
            }}
          >
            <div className="font-medium">
              {activeAppointment.title}
            </div>
            <div className="text-xs mt-1 opacity-90">
              {format(new Date(activeAppointment.start_time), 'HH:mm')} - 
              {format(new Date(activeAppointment.end_time), 'HH:mm')}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}