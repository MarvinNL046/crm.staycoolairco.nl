'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentUpdate?: () => void;
}

export function WeekView({
  currentDate,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentUpdate,
}: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    scrollToCurrentTime();
  }, []);

  const scrollToCurrentTime = () => {
    if (!scrollContainerRef.current) return;
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const scrollPosition = (hours - 8 + minutes / 60) * 60; // 60px per hour
    
    scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition - 100);
  };

  // Get week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Business hours (8:00 - 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  
  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(new Date(apt.start_time), day));
  };
  
  // Calculate appointment position and height
  const getAppointmentStyle = (appointment: Appointment) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    const top = (startHour - 8) * 60; // 60px per hour, starting at 8am
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
    
    const groups: Appointment[][] = [];
    
    sorted.forEach((apt) => {
      let added = false;
      
      for (const group of groups) {
        const overlaps = group.some((groupApt) => {
          const aptStart = new Date(apt.start_time).getTime();
          const aptEnd = new Date(apt.end_time).getTime();
          const groupStart = new Date(groupApt.start_time).getTime();
          const groupEnd = new Date(groupApt.end_time).getTime();
          
          return (aptStart < groupEnd && aptEnd > groupStart);
        });
        
        if (overlaps) {
          group.push(apt);
          added = true;
          break;
        }
      }
      
      if (!added) {
        groups.push([apt]);
      }
    });
    
    return groups;
  };

  // Get current time line position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    if (hours < 8 || hours > 20) return null;
    return (hours - 8) * 60;
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
    if (!dropData?.date || dropData?.hour === undefined) {
      setActiveId(null);
      return;
    }

    // Calculate new times
    const newDate = new Date(dropData.date);
    const duration = new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime();
    
    const newStartTime = new Date(newDate);
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
  const activeAppointment = activeId ? appointments.find(apt => apt.id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-white">
        {/* Header with day names */}
        <div className="border-b bg-white sticky top-0 z-20">
          <div className="grid grid-cols-8 h-20">
            <div className="border-r px-2 py-2 flex items-end justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToCurrentTime}
                className="mb-2"
              >
                Nu
              </Button>
            </div>
            {weekDays.map((day, index) => {
              const isActive = isToday(day);
              return (
                <div
                  key={index}
                  className={cn(
                    "border-r px-2 py-2 text-center",
                    index === 6 && "border-r-0"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium",
                    isActive ? "text-blue-600" : "text-gray-600"
                  )}>
                    {format(day, 'EEE', { locale: nl })}
                  </div>
                  <div className={cn(
                    "text-2xl mt-1",
                    isActive && "bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          <div className="relative">
            {/* Time labels and grid */}
            {hours.map((hour) => (
              <div key={hour} className="relative">
                <div className="grid grid-cols-8 h-[60px] border-b">
                  <div className="border-r px-2 py-2 text-xs text-gray-500 text-right">
                    {hour}:00
                  </div>
                  {weekDays.map((day, dayIndex) => (
                    <DroppableTimeSlot
                      key={`${dayIndex}-${hour}`}
                      id={`slot-${dayIndex}-${hour}`}
                      date={day}
                      hour={hour}
                      className={cn(
                        "border-r",
                        dayIndex === 6 && "border-r-0"
                      )}
                      onClick={() => onTimeSlotClick(day, `${hour}:00`)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="grid grid-cols-8">
                  <div className="col-span-1" />
                  <div className="col-span-7 relative">
                    <div className="absolute inset-x-0 h-0.5 bg-red-500">
                      <div className="absolute -left-2 -top-1 w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              const overlappingGroups = getOverlappingAppointments(dayAppointments);
              
              return (
                <div key={dayIndex}>
                  {overlappingGroups.map((group) => {
                    const width = 100 / group.length;
                    
                    return group.map((appointment, groupIndex) => {
                      const style = getAppointmentStyle(appointment);
                      const left = (dayIndex + 1) * (100 / 8) + (groupIndex * width * (1 / 8));
                      
                      return (
                        <ResizableAppointment
                          key={appointment.id}
                          appointment={appointment}
                          style={{
                            ...style,
                            left: `${left}%`,
                            width: `${width * (1 / 8)}%`,
                            paddingRight: '2px',
                          }}
                          onClick={() => onAppointmentClick(appointment)}
                          onResize={() => onAppointmentUpdate && onAppointmentUpdate()}
                          view="week"
                        />
                      );
                    });
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeAppointment ? (
          <div
            className="rounded p-1 text-xs text-white shadow-lg"
            style={{
              backgroundColor: activeAppointment.color || '#3B82F6',
              width: '150px',
            }}
          >
            <div className="font-medium truncate">
              {activeAppointment.title}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}