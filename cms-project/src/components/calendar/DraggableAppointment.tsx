'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DraggableAppointmentProps {
  appointment: any;
  style: React.CSSProperties;
  onClick: () => void;
  view: 'month' | 'week' | 'day';
}

export function DraggableAppointment({ 
  appointment, 
  style, 
  onClick,
  view 
}: DraggableAppointmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: appointment.id,
    data: appointment,
  });

  const dragStyle = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  if (view === 'month') {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "text-xs px-1 py-0.5 rounded cursor-pointer truncate font-medium transition-opacity",
          isDragging && "opacity-50"
        )}
        style={{ 
          ...style,
          ...dragStyle,
          backgroundColor: appointment.color,
          color: 'white'
        }}
        onClick={onClick}
        {...listeners}
        {...attributes}
      >
        {appointment.all_day ? (
          <span>{appointment.title}</span>
        ) : (
          <>
            {appointment.start_time.toLocaleTimeString('nl-NL', { 
              hour: 'numeric',
              minute: '2-digit' 
            })}
            {' '}
            {appointment.title}
          </>
        )}
      </div>
    );
  }

  if (view === 'week') {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "absolute cursor-pointer transition-all hover:z-20 hover:shadow-lg",
          isDragging && "opacity-50 z-50"
        )}
        style={{
          ...style,
          ...dragStyle,
        }}
        onClick={onClick}
        {...listeners}
        {...attributes}
      >
        <div
          className="h-full rounded p-1 text-xs text-white overflow-hidden"
          style={{
            backgroundColor: appointment.color || '#3B82F6',
          }}
        >
          <div className="font-medium truncate">
            {format(new Date(appointment.start_time), 'HH:mm')} - {appointment.title}
          </div>
          {appointment.customer?.name && (
            <div className="truncate opacity-90">
              {appointment.customer.name}
            </div>
          )}
          {appointment.location && (
            <div className="truncate opacity-80">
              📍 {appointment.location}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Day view
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute cursor-pointer transition-all hover:z-30 hover:shadow-lg pointer-events-auto",
        isDragging && "opacity-50 z-50"
      )}
      style={{
        ...style,
        ...dragStyle,
      }}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <div
        className="h-full rounded-lg p-2 text-white overflow-hidden"
        style={{
          backgroundColor: appointment.color || '#3B82F6',
        }}
      >
        <div className="text-xs font-medium">
          {format(new Date(appointment.start_time), 'HH:mm')} - 
          {format(new Date(appointment.end_time), 'HH:mm')}
        </div>
        <div className="font-medium mt-1 text-sm">
          {appointment.title}
        </div>
        {appointment.customer?.name && (
          <div className="text-xs mt-1 opacity-90">
            {appointment.customer.name}
          </div>
        )}
        {appointment.location && (
          <div className="text-xs mt-1 opacity-80">
            📍 {appointment.location}
          </div>
        )}
        {appointment.description && (
          <div className="text-xs mt-2 opacity-80 line-clamp-2">
            {appointment.description}
          </div>
        )}
      </div>
    </div>
  );
}