"use client"

import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Phone, 
  Mail, 
  MapPin,
  MoreHorizontal,
  Calendar,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

// Lead status columns configuration voor StayCool workflow
const statusColumns = [
  {
    id: 'new',
    title: 'Nieuwe Lead',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-800',
    count: 0
  },
  {
    id: 'contacted',
    title: 'Opgebeld/Contact',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-800',
    count: 0
  },
  {
    id: 'qualified',
    title: 'Geen Gehoor',
    color: 'bg-orange-50 border-orange-200',
    headerColor: 'bg-orange-100 text-orange-800',
    count: 0,
    showRetryButton: true // Special flag voor retry button
  },
  {
    id: 'proposal',
    title: 'Offerte Verstuurd',
    color: 'bg-purple-50 border-purple-200',
    headerColor: 'bg-purple-100 text-purple-800',
    count: 0
  },
  {
    id: 'won',
    title: 'Gewonnen',
    color: 'bg-emerald-50 border-emerald-200',
    headerColor: 'bg-emerald-100 text-emerald-800',
    count: 0
  }
]


interface Lead {
  id: number | string
  name: string
  contact?: string
  email: string
  phone?: string
  location?: string
  city?: string // Supabase might use city instead of location
  source?: string
  status: string
  value?: number
  created?: string
  created_at?: string // Supabase timestamp
  assignedTo?: string
  assigned_to?: string // Supabase snake_case
  company?: string // Additional field from Supabase
  retry_count?: number // Voor geen gehoor tracking
  tags?: string[] // From Supabase
  notes?: string // From Supabase
}

interface KanbanCardProps {
  lead: Lead
  onRetry?: (leadId: string | number) => void
  onArchive?: (leadId: string | number) => void
  onEdit?: (lead: Lead) => void
}

function KanbanCard({ lead, onRetry, onArchive, onEdit }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold text-gray-900 leading-tight">
              {lead.company || lead.name}
            </CardTitle>
            <p className="text-xs text-gray-600 mt-1">{lead.contact || lead.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {lead.assignedTo || lead.assigned_to || 'NA'}
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(lead)
                  }}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  Bewerken
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Phone className="mr-2 h-3 w-3" />
                  Bellen
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-3 w-3" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="mr-2 h-3 w-3" />
                  Afspraak
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {(lead.location || lead.city) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {lead.location || lead.city}
          </div>
        )}
        
        {lead.email && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Mail className="h-3 w-3" />
            {lead.email}
          </div>
        )}
        
        {lead.phone && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            {lead.phone}
          </div>
        )}

        {lead.source && (
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {lead.source}
            </Badge>
          </div>
        )}
        
        {(lead.created || lead.created_at) && (
          <div className="text-xs text-gray-400 pt-1">
            {lead.created || new Date(lead.created_at!).toLocaleDateString('nl-NL')}
          </div>
        )}
        
        {/* Retry button voor "geen gehoor" status */}
        {lead.status === 'qualified' && (
          <div className="pt-2 border-t mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Pogingen: {lead.retry_count || 0}/3
              </span>
              {(lead.retry_count || 0) < 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRetry?.(lead.id)
                  }}
                >
                  Opnieuw proberen
                </Button>
              )}
            </div>
            {(lead.retry_count || 0) >= 3 && (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive?.(lead.id)
                }}
              >
                Verwijderen uit lijst
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface KanbanColumnProps {
  column: typeof statusColumns[0]
  leads: Lead[]
  onRetry?: (leadId: string | number) => void
  onArchive?: (leadId: string | number) => void
  onEdit?: (lead: Lead) => void
}

function KanbanColumn({ column, leads, onRetry, onArchive, onEdit }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 rounded-t-lg ${column.headerColor} border-b`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 ${column.color} rounded-b-lg min-h-[600px] overflow-y-auto transition-colors ${
          isOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-opacity-70' : ''
        }`}
      >
        {/* Drop zone at the top */}
        {leads.length > 0 && (
          <div className={`mb-3 p-6 border-2 border-dashed rounded-lg transition-all ${
            isOver 
              ? 'border-blue-500 bg-blue-50 bg-opacity-50' 
              : 'border-gray-300 bg-gray-50 bg-opacity-30'
          } h-16`}>
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Drop here to add
            </div>
          </div>
        )}
        
        <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} onRetry={onRetry} onArchive={onArchive} onEdit={onEdit} />
            ))}
          </div>
        </SortableContext>
        
        {/* Drop zone at the bottom */}
        <div className={`mt-3 p-8 border-2 border-dashed rounded-lg transition-all ${
          isOver 
            ? 'border-blue-500 bg-blue-50 bg-opacity-50' 
            : 'border-gray-300 bg-gray-50 bg-opacity-30'
        } ${leads.length === 0 ? 'h-32' : 'h-20'}`}>
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {leads.length === 0 ? 'Drop leads here' : 'Drop here to add'}
          </div>
        </div>
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  leads: Lead[]
  onStatusChange?: (leadId: number | string, newStatus: string) => void
  onRetryLead?: (leadId: number | string) => void
  onArchiveLead?: (leadId: number | string) => void
  onEditLead?: (lead: Lead) => void
}

export function KanbanBoard({ leads: initialLeads, onStatusChange, onRetryLead, onArchiveLead, onEditLead }: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | number | null>(null)

  // Update local state when props change
  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  const handleRetry = (leadId: string | number) => {
    // Call parent retry handler - pass ID as-is (could be UUID string or number)
    onRetryLead?.(leadId)
  }

  const handleArchive = (leadId: string | number) => {
    // Call parent archive handler - pass ID as-is (could be UUID string or number)
    onArchiveLead?.(leadId)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = active.id
    const newStatus = over.id as string

    // Check if we're dropping over a valid column
    const validStatuses = statusColumns.map(col => col.id)
    if (!validStatuses.includes(newStatus)) return

    // Update lead status
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: newStatus }
          : lead
      )
    )

    // Call optional callback - pass ID as-is (could be UUID string or number)
    onStatusChange?.(leadId, newStatus)
  }

  // Group leads by status
  const leadsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = leads.filter(lead => lead.status === column.id)
    return acc
  }, {} as Record<string, Lead[]>)

  // Get the currently dragged lead for overlay
  const activeItem = activeId ? leads.find(lead => lead.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 h-full max-h-[800px]">
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leads={leadsByStatus[column.id] || []}
            onRetry={handleRetry}
            onArchive={handleArchive}
            onEdit={onEditLead}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <KanbanCard lead={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )
}