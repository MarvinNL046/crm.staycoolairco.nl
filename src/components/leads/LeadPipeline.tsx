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
              
              <div className="space-y-3 min-h-[500px]">
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
                    className={`bg-white rounded-lg p-3 shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                      draggedLead?.id === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Header with name and avatar */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate hover:underline">
                          {lead.name}
                          {lead.created_at && (
                            <span className="text-gray-500 font-normal">
                              {' | '}
                              {new Date(lead.created_at).toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                          <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lead details table */}
                    <div className="space-y-1 mb-2">
                      {lead.source && (
                        <div className="flex text-xs">
                          <span className="font-semibold text-gray-600 mr-2">Lead bron:</span>
                          <span className="text-gray-800">{lead.source}</span>
                        </div>
                      )}
                      
                      {lead.value && (
                        <div className="flex text-xs">
                          <span className="font-semibold text-gray-600 mr-2">Waarde:</span>
                          <span className="text-gray-800">
                            €{lead.value.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      
                      {lead.company && (
                        <div className="flex text-xs">
                          <span className="font-semibold text-gray-600 mr-2">Bedrijf:</span>
                          <span className="text-gray-800 truncate">{lead.company}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action icons */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      {/* Phone */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (lead.phone) window.open(`tel:${lead.phone}`)
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Bellen"
                      >
                        <Phone className="h-4 w-4 text-gray-500" />
                      </button>
                      
                      {/* Messages */}
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Berichten"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                      
                      {/* Tags */}
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Tags"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </button>
                      
                      {/* Notes */}
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Notities"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      
                      {/* Tasks */}
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Taken"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </button>
                      
                      {/* Calendar */}
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Afspraken"
                      >
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {/* Tags display */}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex-1 flex justify-end">
                          <span className="text-xs text-gray-500">
                            {lead.tags.length} tag{lead.tags.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
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