'use client'

import { useState } from 'react'
import LeadSearch from './LeadSearch'
import LeadDetailModal from './LeadDetailModal'
import LeadForm from './LeadForm'
import type { Database } from '@/types/database.types'

type Lead = Database['public']['Tables']['leads']['Row']

interface LeadListViewProps {
  tenantId: string
}

export default function LeadListView({ tenantId }: LeadListViewProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleLeadUpdate = () => {
    setRefreshKey(prev => prev + 1)
    setSelectedLead(null)
  }

  const handleLeadDelete = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleNewLead = () => {
    setShowLeadForm(true)
  }

  const handleLeadFormSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      <LeadSearch 
        key={refreshKey}
        tenantId={tenantId}
        onLeadSelect={handleLeadSelect}
        onNewLead={handleNewLead}
      />

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onDelete={handleLeadDelete}
        />
      )}

      {showLeadForm && (
        <LeadForm
          tenantId={tenantId}
          onClose={() => setShowLeadForm(false)}
          onSuccess={handleLeadFormSuccess}
        />
      )}
    </>
  )
}