'use client';

import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ResizableAppointmentProps {
  appointment: any;
  style: React.CSSProperties;
  onClick: () => void;
  onResize?: (newStartTime: Date, newEndTime: Date) => void;
  view: 'week' | 'day';
}

export function ResizableAppointment({ 
  appointment, 
  style, 
  onClick,
  onResize,
  view 
}: ResizableAppointmentProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<'top' | 'bottom' | null>(null);
  const [tempHeight, setTempHeight] = useState(0);
  const [isOverResizeHandle, setIsOverResizeHandle] = useState(false);
  const resizeStartY = useRef(0);
  const originalHeight = useRef(0);
  const originalTop = useRef(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: appointment.id,
    data: appointment,
    disabled: isResizing || isOverResizeHandle,
  });

  const dragStyle = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const handleResizeStart = (e: React.MouseEvent, mode: 'top' | 'bottom') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeMode(mode);
    resizeStartY.current = e.clientY;
    
    const element = e.currentTarget.parentElement as HTMLElement;
    originalHeight.current = element.offsetHeight;
    originalTop.current = element.offsetTop;
    setTempHeight(originalHeight.current);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeMode) return;

    const deltaY = e.clientY - resizeStartY.current;
    
    if (resizeMode === 'bottom') {
      // Resizing from bottom - just change height
      const newHeight = Math.max(30, originalHeight.current + deltaY);
      setTempHeight(newHeight);
    } else {
      // Resizing from top - change both position and height
      const newHeight = Math.max(30, originalHeight.current - deltaY);
      setTempHeight(newHeight);
    }
  };

  const handleResizeEnd = async (e: MouseEvent) => {
    if (!isResizing || !resizeMode || !onResize) {
      setIsResizing(false);
      setResizeMode(null);
      return;
    }

    const deltaY = e.clientY - resizeStartY.current;
    const pixelsPerHour = 60;
    const hoursChanged = deltaY / pixelsPerHour;

    const startTime = new Date(appointment.start_time);
    const endTime = new Date(appointment.end_time);

    let newStartTime = startTime;
    let newEndTime = endTime;

    if (resizeMode === 'top') {
      // Adjust start time
      newStartTime = new Date(startTime);
      newStartTime.setMinutes(newStartTime.getMinutes() + (hoursChanged * 60));
      
      // Don't allow start time to be after end time
      if (newStartTime >= endTime) {
        newStartTime = new Date(endTime);
        newStartTime.setMinutes(newStartTime.getMinutes() - 30);
      }
    } else {
      // Adjust end time
      newEndTime = new Date(endTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + (hoursChanged * 60));
      
      // Don't allow end time to be before start time
      if (newEndTime <= startTime) {
        newEndTime = new Date(startTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + 30);
      }
    }

    // Round to nearest 5 minutes for more flexibility
    const roundMinutes = (date: Date) => {
      const minutes = date.getMinutes();
      const rounded = Math.round(minutes / 5) * 5;
      date.setMinutes(rounded);
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    };

    newStartTime = roundMinutes(newStartTime);
    newEndTime = roundMinutes(newEndTime);

    // Update appointment
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

      toast.success('Afspraak aangepast', {
        description: `${format(newStartTime, 'HH:mm')} - ${format(newEndTime, 'HH:mm')}`,
      });

      if (onResize) {
        onResize(newStartTime, newEndTime);
      }
    } catch (error) {
      console.error('Error resizing appointment:', error);
      toast.error('Fout bij aanpassen', {
        description: 'De afspraak kon niet worden aangepast.',
      });
    }

    setIsResizing(false);
    setResizeMode(null);
    setTempHeight(0);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'ns-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
      };
    }
  }, [isResizing, resizeMode]);

  const finalStyle = {
    ...style,
    ...dragStyle,
    ...(isResizing && tempHeight > 0 ? { height: `${tempHeight}px` } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute cursor-pointer transition-all hover:z-30 hover:shadow-lg pointer-events-auto group",
        isDragging && "opacity-50 z-50",
        isResizing && "z-50"
      )}
      style={finalStyle}
      {...(!isResizing ? listeners : {})}
      {...attributes}
    >
      <div
        className={cn(
          "h-full rounded-lg p-2 text-white overflow-hidden relative",
          view === 'week' ? "rounded" : "rounded-lg"
        )}
        style={{
          backgroundColor: appointment.color || '#3B82F6',
        }}
      >

        {/* Resize handles - bigger and more visible */}
        <div
          className={cn(
            "absolute left-0 right-0 -top-2 h-4 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-20",
            isResizing && resizeMode === 'top' && "opacity-100"
          )}
          onMouseEnter={() => setIsOverResizeHandle(true)}
          onMouseLeave={() => setIsOverResizeHandle(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'top');
          }}
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-1.5 bg-white/90 rounded-full shadow-sm" />
          </div>
        </div>
        <div
          className={cn(
            "absolute left-0 right-0 -bottom-2 h-4 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-20",
            isResizing && resizeMode === 'bottom' && "opacity-100"
          )}
          onMouseEnter={() => setIsOverResizeHandle(true)}
          onMouseLeave={() => setIsOverResizeHandle(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResizeStart(e, 'bottom');
          }}
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-1.5 bg-white/90 rounded-full shadow-sm" />
          </div>
        </div>

        {/* Content - clickable area */}
        <div 
          className="relative h-full"
          title="Rechtsklik om te bewerken"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isResizing) {
              onClick();
            }
          }}
        >
          <div className={cn("text-xs font-medium", view === 'day' && "text-sm")}>
          {format(new Date(appointment.start_time), 'HH:mm')} - 
          {format(new Date(appointment.end_time), 'HH:mm')}
        </div>
        <div className={cn("font-medium mt-1", view === 'week' ? "text-xs truncate" : "text-sm")}>
          {appointment.title}
        </div>
        {appointment.customer?.name && (
          <div className={cn("mt-1 opacity-90", view === 'week' ? "text-xs truncate" : "text-xs")}>
            {appointment.customer.name}
          </div>
        )}
        {appointment.location && view === 'day' && (
          <div className="text-xs mt-1 opacity-80">
            📍 {appointment.location}
          </div>
        )}
        {appointment.description && view === 'day' && (
          <div className="text-xs mt-2 opacity-80 line-clamp-2">
            {appointment.description}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}