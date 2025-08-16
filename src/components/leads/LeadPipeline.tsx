'use client'

import { useState, useEffect } from 'react'
import { Plus, Phone, Mail, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/ToastProvider'
import LeadForm from './LeadForm'
import LeadDetailModal from './LeadDetailModal'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type Stage = Database['public']['Tables']['pipeline_stages']['Row']
type LeadStatus = Database['public']['Enums']['lead_status'] | 'converted'

interface LeadPipelineProps {
  stages: Stage[]
  initialLeads: Lead[]
  tenantId: string
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
  converted: 'bg-green-100 text-green-800',
}

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nieuw',
  contacted: 'Gecontacteerd',
  qualified: 'Gekwalificeerd',
  proposal: 'Offerte',
  won: 'Gewonnen',
  lost: 'Verloren',
  converted: 'Geconverteerd',
}

export default function LeadPipeline({ stages, initialLeads, tenantId }: LeadPipelineProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [draggedOverStatus, setDraggedOverStatus] = useState<LeadStatus | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'scroll'>('grid')
  const supabase = createClient()
  const { showToast } = useToast()

  // Setup realtime subscription for leads changes
  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload: any) => {
          console.log('Realtime change:', payload)
          handleRealtimeChange(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  const handleRealtimeChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setLeads(currentLeads => {
      switch (eventType) {
        case 'INSERT':
          // Add new lead if it doesn't already exist
          if (!currentLeads.find(lead => lead.id === newRecord.id)) {
            showToast('info', 'Nieuwe lead toegevoegd', `${newRecord.name} is toegevoegd aan de pipeline`, 3000)
            return [...currentLeads, newRecord]
          }
          return currentLeads

        case 'UPDATE':
          // Update existing lead and show notification for status changes
          const existingLead = currentLeads.find(lead => lead.id === newRecord.id)
          if (existingLead && existingLead.status !== newRecord.status) {
            const oldStatusLabel = statusLabels[existingLead.status as LeadStatus]
            const newStatusLabel = statusLabels[newRecord.status as LeadStatus]
            showToast('success', 'Lead status gewijzigd', `${newRecord.name}: ${oldStatusLabel} → ${newStatusLabel}`, 3000)
          }
          
          return currentLeads.map(lead =>
            lead.id === newRecord.id ? { ...lead, ...newRecord } : lead
          )

        case 'DELETE':
          // Remove deleted lead
          const deletedLead = currentLeads.find(lead => lead.id === oldRecord.id)
          if (deletedLead) {
            showToast('warning', 'Lead verwijderd', `${deletedLead.name} is verwijderd uit de pipeline`, 3000)
          }
          return currentLeads.filter(lead => lead.id !== oldRecord.id)

        default:
          return currentLeads
      }
    })
  }

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status)
  }

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverStatus(status)
  }

  const handleDragLeave = () => {
    setDraggedOverStatus(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault()
    
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null)
      return
    }

    const oldStatus = draggedLead.status

    // Update locally first for immediate feedback
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === draggedLead.id 
          ? { ...lead, status: newStatus as any }
          : lead
      )
    )

    try {
      // Update in database
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', draggedLead.id)

      if (error) {
        throw error
      }

      // Note: No need to refresh leads manually - realtime will handle the update
    } catch (error) {
      console.error('Error updating lead status:', error)
      // Revert on error
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === draggedLead.id 
            ? { ...lead, status: oldStatus }
            : lead
        )
      )
    }

    setDraggedLead(null)
    setDraggedOverStatus(null)
  }

  const refreshLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    
    if (data) {
      setLeads(data)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleLeadUpdate = () => {
    refreshLeads()
    setSelectedLead(null)
  }

  const handleLeadDelete = () => {
    refreshLeads()
  }

  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Grid weergave (schaalt mee met scherm)"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border flex items-center gap-2 ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('scroll')}
            title="Horizontale scroll (klassieke Kanban)"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border flex items-center gap-2 ${
              viewMode === 'scroll'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="hidden sm:inline">Scroll</span>
          </button>
        </div>
      </div>

      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
        : "flex gap-6 overflow-x-auto pb-4 min-w-full"
      }>
      {stages.map((stage) => {
        const status = stage.key as LeadStatus
        const stageLeads = getLeadsByStatus(status)
        
        return (
          <div
            key={stage.id}
            className={viewMode === 'grid' ? "min-w-0" : "flex-shrink-0 w-96"}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className={`bg-gray-100 rounded-lg p-4 transition-all duration-200 ${
              draggedOverStatus === status ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {statusLabels[status]}
                </h3>
                <span className="text-sm text-gray-500">
                  {stageLeads.length}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[400px]">
                {stageLeads.length === 0 && (
                  <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500">Sleep leads hierheen</p>
                  </div>
                )}
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onClick={() => handleLeadClick(lead)}
                    className={`bg-white rounded-lg p-4 shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                      draggedLead?.id === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{lead.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[lead.status]}`}>
                        {statusLabels[lead.status]}
                      </span>
                    </div>
                    
                    {lead.company && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Building2 className="h-4 w-4 mr-1" />
                        {lead.company}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {lead.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                    
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {status === 'new' && (
                <button 
                  onClick={() => setShowLeadForm(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nieuwe lead
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
    
    {showLeadForm && (
      <LeadForm
        tenantId={tenantId}
        onClose={() => setShowLeadForm(false)}
        onSuccess={refreshLeads}
      />
    )}

    {selectedLead && (
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={handleLeadUpdate}
        onDelete={handleLeadDelete}
      />
    )}
    </>
  )
}