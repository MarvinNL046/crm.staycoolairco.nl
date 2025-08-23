'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  id: string;
  date: Date;
  hour: number;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DroppableTimeSlot({ 
  id, 
  date, 
  hour, 
  children, 
  onClick,
  className 
}: DroppableTimeSlotProps) {
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id,
    data: {
      date,
      hour,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "hover:bg-gray-50 cursor-pointer transition-colors",
        isOver && "bg-blue-50",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}