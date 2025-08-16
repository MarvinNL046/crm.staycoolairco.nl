'use client'

import { useState } from 'react'
import { Plus, Phone, Mail, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LeadForm from './LeadForm'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']
type Stage = Database['public']['Tables']['pipeline_stages']['Row']
type LeadStatus = Database['public']['Enums']['lead_status']

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
}

const statusLabels: Record<LeadStatus, string> = {
  new: 'Nieuw',
  contacted: 'Gecontacteerd',
  qualified: 'Gekwalificeerd',
  proposal: 'Offerte',
  won: 'Gewonnen',
  lost: 'Verloren',
}

export default function LeadPipeline({ stages, initialLeads, tenantId }: LeadPipelineProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const supabase = createClient()

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status)
  }

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault()
    
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null)
      return
    }

    // Update locally first for immediate feedback
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === draggedLead.id 
          ? { ...lead, status: newStatus }
          : lead
      )
    )

    // Update in database
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', draggedLead.id)

    if (error) {
      console.error('Error updating lead status:', error)
      // Revert on error
      setLeads(initialLeads)
    }

    setDraggedLead(null)
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

  return (
    <>
      <div className="flex gap-6 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const status = stage.key as LeadStatus
        const stageLeads = getLeadsByStatus(status)
        
        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {statusLabels[status]}
                </h3>
                <span className="text-sm text-gray-500">
                  {stageLeads.length}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="bg-white rounded-lg p-4 shadow-sm cursor-move hover:shadow-md transition-shadow"
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
    </>
  )
}